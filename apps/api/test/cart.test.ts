import assert from "node:assert/strict";
import test from "node:test";
import { db } from "../src/db.js";
import { createAuthenticatedApp } from "./helpers.js";

test("GET /cart returns items and their total", async (t) => {
  const { app, headers, user } = await createAuthenticatedApp(t);
  const entry = db.cart.add(user.id, "p-001", 2);
  const response = await app.inject({ method: "GET", url: "/cart", headers });

  assert.equal(response.statusCode, 200);
  const cart = response.json();
  assert.equal(cart.items.length, 1);
  assert.equal(cart.items[0].id, entry.id);
  assert.equal(cart.items[0].persona.id, "p-001");
  assert.equal(cart.items[0].quantity, 2);
  assert.equal(cart.total, 99.98);
});

test("POST /cart adds a persona to the cart", async (t) => {
  const { app, headers, user } = await createAuthenticatedApp(t);
  const response = await app.inject({
    method: "POST",
    url: "/cart",
    headers,
    payload: { personaId: "p-001", quantity: 2 },
  });

  assert.equal(response.statusCode, 200);
  const cart = response.json();
  assert.equal(cart.items.length, 1);
  assert.equal(cart.items[0].personaId, "p-001");
  assert.equal(cart.items[0].quantity, 2);
  assert.equal(cart.total, 99.98);
  assert.equal(db.cart.getByUserId(user.id)[0].quantity, 2);
});

test("PUT /cart/:itemId changes an item quantity", async (t) => {
  const { app, headers, user } = await createAuthenticatedApp(t);
  const entry = db.cart.add(user.id, "p-001", 1);
  const response = await app.inject({
    method: "PUT",
    url: `/cart/${entry.id}`,
    headers,
    payload: { quantity: 3 },
  });

  assert.equal(response.statusCode, 200);
  const cart = response.json();
  assert.equal(cart.items.length, 1);
  assert.equal(cart.items[0].id, entry.id);
  assert.equal(cart.items[0].quantity, 3);
  assert.equal(cart.total, 149.97);
  assert.equal(db.cart.getById(entry.id)?.quantity, 3);
});

test("DELETE /cart/:itemId removes an item", async (t) => {
  const { app, headers, user } = await createAuthenticatedApp(t);
  const entry = db.cart.add(user.id, "p-001", 1);
  const response = await app.inject({
    method: "DELETE",
    url: `/cart/${entry.id}`,
    headers,
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { items: [], total: 0 });
  assert.equal(db.cart.getById(entry.id), undefined);
});
