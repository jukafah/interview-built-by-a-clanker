import assert from "node:assert/strict";
import test from "node:test";
import { orderSchema } from "@acme/shared";
import { db } from "../src/db.js";
import { createAuthenticatedApp } from "./helpers.js";

test("POST /checkout creates an order from cart items", async (t) => {
  const { app, headers, user } = await createAuthenticatedApp(t);
  const entry = db.cart.add(user.id, "p-001", 2);
  const response = await app.inject({
    method: "POST",
    url: "/checkout",
    headers,
    payload: { name: "Test Customer", email: user.email },
  });

  assert.equal(response.statusCode, 201);
  const order = orderSchema.parse(response.json());
  assert.ok(order.id);
  assert.equal(order.userId, user.id);
  assert.equal(order.customerName, "Test Customer");
  assert.equal(order.customerEmail, user.email);
  assert.equal(order.items.length, 1);
  assert.equal(order.items[0].id, entry.id);
  assert.equal(order.items[0].personaId, "p-001");
  assert.equal(order.items[0].quantity, 2);
  assert.equal(order.total, 99.98);
  assert.ok(Number.isFinite(Date.parse(order.createdAt)));
  assert.deepEqual(db.orders.getByUserId(user.id), [order]);
});
