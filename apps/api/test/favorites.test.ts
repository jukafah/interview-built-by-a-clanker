import assert from "node:assert/strict";
import test from "node:test";
import { personaSchema } from "@acme/shared";
import { db } from "../src/db.js";
import { createAuthenticatedApp } from "./helpers.js";

test("GET /favorites lists saved personas", async (t) => {
  const { app, headers, user } = await createAuthenticatedApp(t);
  db.favorites.add(user.id, "p-001");
  const response = await app.inject({
    method: "GET",
    url: "/favorites",
    headers,
  });

  assert.equal(response.statusCode, 200);
  const favorites = personaSchema.array().parse(response.json().favorites);
  assert.deepEqual(
    favorites.map((persona) => persona.id),
    ["p-001"],
  );
});

test("POST /favorites saves a persona", async (t) => {
  const { app, headers, user } = await createAuthenticatedApp(t);
  const response = await app.inject({
    method: "POST",
    url: "/favorites",
    headers,
    payload: { personaId: "p-001" },
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { success: true });
  assert.deepEqual(db.favorites.getByUserId(user.id), ["p-001"]);
});

test("DELETE /favorites/:personaId removes a saved persona", async (t) => {
  const { app, headers, user } = await createAuthenticatedApp(t);
  db.favorites.add(user.id, "p-001");
  const response = await app.inject({
    method: "DELETE",
    url: "/favorites/p-001",
    headers,
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { success: true });
  assert.deepEqual(db.favorites.getByUserId(user.id), []);
});
