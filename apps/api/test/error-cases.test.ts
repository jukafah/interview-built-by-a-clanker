import assert from "node:assert/strict";
import test from "node:test";
import { db } from "../src/db.js";
import { createApp, createAuthenticatedApp, credentials } from "./helpers.js";

test("Registration rejects invalid account fields", async (t) => {
  const app = await createApp(t);
  const response = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: { username: "x", email: "invalid", password: "short" },
  });
  assert.equal(response.statusCode, 400);
  const fields = response.json().error.fieldErrors;
  for (const field of ["username", "email", "password"]) {
    assert.ok(fields[field].length > 0);
  }
});

test("Registration rejects a duplicate email", async (t) => {
  const { app, input, user } = await createAuthenticatedApp(t);
  const response = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: input,
  });
  assert.equal(response.statusCode, 409);
  assert.equal(response.json().error, "Email already registered");
  assert.equal(db.users.getByEmail(input.email)?.id, user.id);
});

test("Login rejects malformed input", async (t) => {
  const app = await createApp(t);
  const response = await app.inject({
    method: "POST",
    url: "/auth/login",
    payload: { email: "invalid" },
  });
  assert.equal(response.statusCode, 400);
  assert.ok(response.json().error.fieldErrors.email.length > 0);
  assert.ok(response.json().error.fieldErrors.password.length > 0);
  assert.equal(response.json().token, undefined);
});

test("Login rejects an incorrect password", async (t) => {
  const { app, input } = await createAuthenticatedApp(t);
  const response = await app.inject({
    method: "POST",
    url: "/auth/login",
    payload: { email: input.email, password: "incorrect-password" },
  });
  assert.equal(response.statusCode, 401);
  assert.equal(response.json().error, "Invalid email or password");
  assert.equal(response.json().token, undefined);
});

for (const url of ["/auth/me", "/cart", "/favorites", "/checkout"]) {
  test(`${url} rejects a request without a token`, async (t) => {
    const app = await createApp(t);
    const response = await app.inject({
      method: url === "/checkout" ? "POST" : "GET",
      url,
      ...(url === "/checkout"
        ? { payload: { name: "Customer", email: credentials().email } }
        : {}),
    });
    assert.equal(response.statusCode, 401);
    assert.equal(response.json().error, "Unauthorized");
  });
}

test("Catalog returns an empty list when search has no matches", async (t) => {
  const app = await createApp(t);
  const response = await app.inject({
    method: "GET",
    url: "/personas?q=no-such-persona-5837",
  });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), []);
});

test("Persona details return 404 for an unknown ID", async (t) => {
  const app = await createApp(t);
  const response = await app.inject({
    method: "GET",
    url: "/personas/missing-persona",
  });
  assert.equal(response.statusCode, 404);
  assert.equal(response.json().error, "Persona not found");
});

const shoppingErrors = [
  {
    name: "Cart rejects a zero quantity",
    method: "POST",
    url: "/cart",
    payload: { personaId: "p-001", quantity: 0 },
    status: 400,
    field: "quantity",
  },
  {
    name: "Cart rejects an unknown persona",
    method: "POST",
    url: "/cart",
    payload: { personaId: "missing-persona", quantity: 1 },
    status: 404,
    error: "Persona not found",
  },
  {
    name: "Cart update rejects an unknown item",
    method: "PUT",
    url: "/cart/missing-item",
    payload: { quantity: 2 },
    status: 404,
    error: "Cart item not found",
  },
  {
    name: "Cart removal rejects an unknown item",
    method: "DELETE",
    url: "/cart/missing-item",
    status: 404,
    error: "Cart item not found",
  },
  {
    name: "Favorites require a persona ID",
    method: "POST",
    url: "/favorites",
    payload: {},
    status: 400,
    error: "personaId is required",
  },
  {
    name: "Favorites reject an unknown persona",
    method: "POST",
    url: "/favorites",
    payload: { personaId: "missing-persona" },
    status: 404,
    error: "Persona not found",
  },
  {
    name: "Favorite removal rejects an unsaved persona",
    method: "DELETE",
    url: "/favorites/p-001",
    status: 404,
    error: "Favorite not found",
  },
  {
    name: "Checkout rejects an empty cart",
    method: "POST",
    url: "/checkout",
    payload: { name: "Customer", email: "customer@example.com" },
    status: 400,
    error: "Cart is empty",
  },
] as const;

for (const scenario of shoppingErrors) {
  test(scenario.name, async (t) => {
    const { app, headers, user } = await createAuthenticatedApp(t);
    const response = await app.inject({
      method: scenario.method,
      url: scenario.url,
      headers,
      ...("payload" in scenario ? { payload: scenario.payload } : {}),
    });
    assert.equal(response.statusCode, scenario.status);
    if ("field" in scenario) {
      assert.ok(response.json().error.fieldErrors[scenario.field].length > 0);
    } else {
      assert.equal(response.json().error, scenario.error);
    }
    assert.deepEqual(db.cart.getByUserId(user.id), []);
    assert.deepEqual(db.favorites.getByUserId(user.id), []);
    assert.deepEqual(db.orders.getByUserId(user.id), []);
  });
}

test("Cart rejects a fractional quantity without changing the item", async (t) => {
  const { app, headers, user } = await createAuthenticatedApp(t);
  const item = db.cart.add(user.id, "p-001", 2);
  const response = await app.inject({
    method: "PUT",
    url: `/cart/${item.id}`,
    headers,
    payload: { quantity: 1.5 },
  });
  assert.equal(response.statusCode, 400);
  assert.ok(response.json().error.fieldErrors.quantity.length > 0);
  assert.equal(db.cart.getById(item.id)?.quantity, 2);
});

test("Checkout rejects invalid customer details without changing the cart", async (t) => {
  const { app, headers, user } = await createAuthenticatedApp(t);
  const item = db.cart.add(user.id, "p-001", 2);
  const response = await app.inject({
    method: "POST",
    url: "/checkout",
    headers,
    payload: { name: "", email: "invalid" },
  });
  assert.equal(response.statusCode, 400);
  const fields = response.json().error.fieldErrors;
  assert.ok(fields.name.length > 0);
  assert.ok(fields.email.length > 0);
  assert.deepEqual(db.cart.getByUserId(user.id), [item]);
  assert.deepEqual(db.orders.getByUserId(user.id), []);
});
