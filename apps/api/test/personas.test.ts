import assert from "node:assert/strict";
import test from "node:test";
import { personaSchema } from "@acme/shared";
import { createApp } from "./helpers.js";

test("GET /personas lists the persona catalog", async (t) => {
  const app = await createApp(t);
  const response = await app.inject({ method: "GET", url: "/personas" });

  assert.equal(response.statusCode, 200);
  const personas = personaSchema.array().parse(response.json());
  assert.ok(personas.length > 0);
  assert.ok(personas.some((persona) => persona.id === "p-001"));
});

test("GET /personas/:id returns persona details", async (t) => {
  const app = await createApp(t);
  const response = await app.inject({ method: "GET", url: "/personas/p-001" });

  assert.equal(response.statusCode, 200);
  const persona = personaSchema.parse(response.json());
  assert.equal(persona.id, "p-001");
  assert.equal(persona.name, "Refactor Rex");
  assert.equal(persona.price, 49.99);
});
