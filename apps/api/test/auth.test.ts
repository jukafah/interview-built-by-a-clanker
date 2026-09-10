import assert from "node:assert/strict";
import test from "node:test";
import { createApp, createAuthenticatedApp, credentials } from "./helpers.js";

test("POST /auth/register creates a user and issues a token", async (t) => {
  const app = await createApp(t);
  const input = credentials();
  const response = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: input,
  });

  assert.equal(response.statusCode, 201);
  const { user, token } = response.json();
  assert.ok(user.id);
  assert.deepEqual(user, {
    id: user.id,
    username: input.username,
    email: input.email,
  });
  const claims = app.jwt.verify<{ id: string; email: string }>(token);
  assert.equal(claims.id, user.id);
  assert.equal(claims.email, input.email);
});

test("POST /auth/login authenticates an existing user", async (t) => {
  const { app, input, user } = await createAuthenticatedApp(t);
  const response = await app.inject({
    method: "POST",
    url: "/auth/login",
    payload: { email: input.email, password: input.password },
  });

  assert.equal(response.statusCode, 200);
  const body = response.json();
  assert.deepEqual(body.user, user);
  assert.equal(app.jwt.verify<{ id: string }>(body.token).id, user.id);
});

test("GET /auth/me returns the authenticated user", async (t) => {
  const { app, headers, user } = await createAuthenticatedApp(t);
  const response = await app.inject({
    method: "GET",
    url: "/auth/me",
    headers,
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), user);
});
