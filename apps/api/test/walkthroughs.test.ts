import assert from "node:assert/strict";
import test from "node:test";
import { orderSchema } from "@acme/shared";
import { createAuthenticatedApp } from "./helpers.js";

test("Account walkthrough: register, log in, and use the login token", async (t) => {
  const { app, input, user } = await createAuthenticatedApp(t);
  const login = await app.inject({
    method: "POST",
    url: "/auth/login",
    payload: { email: input.email, password: input.password },
  });
  assert.equal(login.statusCode, 200);
  assert.deepEqual(login.json().user, user);
  const me = await app.inject({
    method: "GET",
    url: "/auth/me",
    headers: { authorization: `Bearer ${login.json().token}` },
  });
  assert.equal(me.statusCode, 200);
  assert.deepEqual(me.json(), user);
});

test("Cart walkthrough: add, view, update, and remove an item", async (t) => {
  const { app, headers } = await createAuthenticatedApp(t);
  const added = await app.inject({
    method: "POST",
    url: "/cart",
    headers,
    payload: { personaId: "p-001", quantity: 1 },
  });
  assert.equal(added.statusCode, 200);
  const itemId = added.json().items[0].id;
  const viewed = await app.inject({ method: "GET", url: "/cart", headers });
  assert.equal(viewed.statusCode, 200);
  assert.deepEqual(viewed.json(), added.json());

  const updated = await app.inject({
    method: "PUT",
    url: `/cart/${itemId}`,
    headers,
    payload: { quantity: 2 },
  });
  assert.equal(updated.statusCode, 200);
  assert.equal(updated.json().items[0].quantity, 2);
  assert.equal(updated.json().total, 99.98);
  const reread = await app.inject({ method: "GET", url: "/cart", headers });
  assert.equal(reread.statusCode, 200);
  assert.deepEqual(reread.json(), updated.json());

  const removed = await app.inject({
    method: "DELETE",
    url: `/cart/${itemId}`,
    headers,
  });
  assert.equal(removed.statusCode, 200);
  const empty = await app.inject({ method: "GET", url: "/cart", headers });
  assert.equal(empty.statusCode, 200);
  assert.deepEqual(empty.json(), { items: [], total: 0 });
});

test("Favorites walkthrough: save, list, and remove a persona", async (t) => {
  const { app, headers } = await createAuthenticatedApp(t);
  const saved = await app.inject({
    method: "POST",
    url: "/favorites",
    headers,
    payload: { personaId: "p-001" },
  });
  assert.equal(saved.statusCode, 200);
  const listed = await app.inject({
    method: "GET",
    url: "/favorites",
    headers,
  });
  assert.equal(listed.statusCode, 200);
  assert.deepEqual(
    listed.json().favorites.map((p: { id: string }) => p.id),
    ["p-001"],
  );

  const removed = await app.inject({
    method: "DELETE",
    url: "/favorites/p-001",
    headers,
  });
  assert.equal(removed.statusCode, 200);
  const empty = await app.inject({ method: "GET", url: "/favorites", headers });
  assert.equal(empty.statusCode, 200);
  assert.deepEqual(empty.json().favorites, []);
});

test("Checkout walkthrough: populate a cart and submit customer details", async (t) => {
  const { app, headers, user } = await createAuthenticatedApp(t);
  for (const item of [
    { personaId: "p-001", quantity: 2 },
    { personaId: "p-002", quantity: 1 },
  ]) {
    const added = await app.inject({
      method: "POST",
      url: "/cart",
      headers,
      payload: item,
    });
    assert.equal(added.statusCode, 200);
  }
  const cart = await app.inject({ method: "GET", url: "/cart", headers });
  assert.equal(cart.statusCode, 200);
  const checkout = await app.inject({
    method: "POST",
    url: "/checkout",
    headers,
    payload: { name: "Test Customer", email: user.email },
  });
  assert.equal(checkout.statusCode, 201);
  const order = orderSchema.parse(checkout.json());
  assert.ok(order.id);
  assert.equal(order.userId, user.id);
  assert.equal(order.customerName, "Test Customer");
  assert.equal(order.customerEmail, user.email);
  assert.deepEqual(order.items, cart.json().items);
  assert.equal(order.total, 189.97);
  assert.ok(Number.isFinite(Date.parse(order.createdAt)));
});
