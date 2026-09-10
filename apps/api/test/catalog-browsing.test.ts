import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { personaSchema } from "@acme/shared";
import { createApp } from "./helpers.js";

async function browse(t: TestContext, query: string) {
  const app = await createApp(t);
  const response = await app.inject({
    method: "GET",
    url: `/personas?${query}`,
  });
  assert.equal(response.statusCode, 200);
  const personas = personaSchema.array().parse(response.json());
  assert.ok(personas.length > 0, "The fixture query should return personas");
  return { app, personas };
}

test("Catalog search finds a persona and opens its details", async (t) => {
  const { app, personas } = await browse(t, "q=rEfAcToR%20rEx");
  assert.deepEqual(
    personas.map((p) => p.id),
    ["p-001"],
  );
  const detail = await app.inject({
    method: "GET",
    url: `/personas/${personas[0].id}`,
  });
  assert.equal(detail.statusCode, 200);
  assert.deepEqual(detail.json(), personas[0]);
});

test("Catalog filters by specialty", async (t) => {
  const { personas } = await browse(t, "specialty=Engineering");
  assert.ok(personas.every((p) => p.specialty === "Engineering"));
  assert.ok(personas.some((p) => p.id === "p-001"));
});

test("Catalog filters by tier", async (t) => {
  const { personas } = await browse(t, "tier=Starter");
  assert.ok(personas.every((p) => p.tier === "Starter"));
  assert.ok(personas.some((p) => p.id === "p-006"));
});

test("Catalog applies an inclusive minimum price", async (t) => {
  const { personas } = await browse(t, "minPrice=49.99");
  assert.ok(personas.every((p) => p.price >= 49.99));
  assert.ok(personas.some((p) => p.id === "p-001"));
  assert.ok(personas.some((p) => p.id === "p-002"));
});

test("Catalog applies an inclusive maximum price", async (t) => {
  const { personas } = await browse(t, "maxPrice=49.99");
  assert.ok(personas.every((p) => p.price <= 49.99));
  assert.ok(personas.some((p) => p.id === "p-001"));
  assert.ok(personas.some((p) => p.id === "p-006"));
});

const sorts = [
  {
    value: "price-asc",
    ordered: (a: number, b: number) => a <= b,
    field: "price",
  },
  {
    value: "price-desc",
    ordered: (a: number, b: number) => a >= b,
    field: "price",
  },
  {
    value: "rating-desc",
    ordered: (a: number, b: number) => a >= b,
    field: "rating",
  },
] as const;

for (const sort of sorts) {
  test(`Catalog sorts by ${sort.value}`, async (t) => {
    const { personas } = await browse(t, `sort=${sort.value}`);
    assert.ok(personas.length > 1);
    for (let i = 1; i < personas.length; i++) {
      assert.ok(
        sort.ordered(personas[i - 1][sort.field], personas[i][sort.field]),
      );
    }
  });
}

test("Catalog sorts by name-asc", async (t) => {
  const { personas } = await browse(t, "sort=name-asc");
  assert.ok(personas.length > 1);
  for (let i = 1; i < personas.length; i++) {
    assert.ok(personas[i - 1].name.localeCompare(personas[i].name) <= 0);
  }
});

test("Catalog combines search, specialty, tier, price, and sorting", async (t) => {
  const { personas } = await browse(
    t,
    "q=refactor&specialty=Engineering&tier=Pro&maxPrice=50&sort=price-asc",
  );
  assert.deepEqual(
    personas.map((p) => p.id),
    ["p-001"],
  );
});
