import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { TestContext } from "node:test";
import type { AuthResponse } from "@acme/shared";
import { buildApp } from "../src/app.js";

export async function createApp(t: TestContext) {
  const app = await buildApp();
  t.after(() => app.close());
  return app;
}

export function credentials() {
  return {
    username: "test-user",
    email: `${randomUUID()}@example.com`,
    password: "test-password",
  };
}

export async function createAuthenticatedApp(t: TestContext) {
  const app = await createApp(t);
  const input = credentials();
  const response = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: input,
  });
  assert.equal(response.statusCode, 201);
  const { token, user } = response.json<AuthResponse>();
  return { app, input, user, headers: { authorization: `Bearer ${token}` } };
}
