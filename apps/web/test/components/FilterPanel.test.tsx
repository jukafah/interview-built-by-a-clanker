import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { FilterPanel } from "~/components/FilterPanel";

function FilterHarness() {
  const [specialty, setSpecialty] = useState<string>();
  const [tier, setTier] = useState<string>();
  const [sort, setSort] = useState<string>();
  return (
    <>
      <FilterPanel
        specialty={specialty}
        tier={tier}
        sort={sort}
        onSpecialtyChange={setSpecialty}
        onTierChange={setTier}
        onSortChange={setSort}
      />
      <output aria-label="Applied specialty">
        {specialty ?? "All specialties"}
      </output>
      <output aria-label="Applied tier">{tier ?? "All tiers"}</output>
      <output aria-label="Applied sort">{sort ?? "Default sort"}</output>
      <button
        onClick={() => {
          setSpecialty("Engineering");
          setTier("Pro");
          setSort("name-asc");
        }}
      >
        Load saved filters
      </button>
    </>
  );
}

test("FilterPanel displays filter choices and the default sort", () => {
  render(<FilterHarness />);

  for (const name of [
    "Engineering",
    "Design",
    "Data",
    "Security",
    "DevOps",
    "Product",
    "Starter",
    "Pro",
    "Enterprise",
  ]) {
    expect(screen.getByRole("button", { name })).toBeInTheDocument();
  }
  expect(screen.getByRole("combobox")).toHaveValue("");
  expect(
    screen.getByRole("option", { name: "Default", selected: true }),
  ).toBeInTheDocument();
  expect(screen.getAllByRole("option")).toHaveLength(5);
});

test("FilterPanel selects, switches, and clears specialties independently", async () => {
  const user = userEvent.setup();
  render(<FilterHarness />);
  for (const name of [
    "Engineering",
    "Design",
    "Data",
    "Security",
    "DevOps",
    "Product",
  ]) {
    await user.click(screen.getByRole("button", { name }));
    expect(
      screen.getByRole("status", { name: "Applied specialty" }),
    ).toHaveTextContent(name);
    expect(
      screen.getByRole("status", { name: "Applied tier" }),
    ).toHaveTextContent("All tiers");
    expect(
      screen.getByRole("status", { name: "Applied sort" }),
    ).toHaveTextContent("Default sort");
  }
  await user.click(screen.getByRole("button", { name: "Product" }));
  expect(
    screen.getByRole("status", { name: "Applied specialty" }),
  ).toHaveTextContent("All specialties");
});

test("FilterPanel selects, switches, and clears tiers independently", async () => {
  const user = userEvent.setup();
  render(<FilterHarness />);
  for (const name of ["Starter", "Pro", "Enterprise"]) {
    await user.click(screen.getByRole("button", { name }));
    expect(
      screen.getByRole("status", { name: "Applied tier" }),
    ).toHaveTextContent(name);
    expect(
      screen.getByRole("status", { name: "Applied specialty" }),
    ).toHaveTextContent("All specialties");
    expect(
      screen.getByRole("status", { name: "Applied sort" }),
    ).toHaveTextContent("Default sort");
  }
  await user.click(screen.getByRole("button", { name: "Enterprise" }));
  expect(
    screen.getByRole("status", { name: "Applied tier" }),
  ).toHaveTextContent("All tiers");
});

for (const value of ["rating-desc", "price-asc", "price-desc", "name-asc"]) {
  test(`FilterPanel applies ${value} and resets sorting to default`, async () => {
    const user = userEvent.setup();
    render(<FilterHarness />);
    const select = screen.getByRole("combobox");
    await user.selectOptions(select, value);
    expect(select).toHaveValue(value);
    expect(
      screen.getByRole("status", { name: "Applied sort" }),
    ).toHaveTextContent(value);
    expect(
      screen.getByRole("status", { name: "Applied specialty" }),
    ).toHaveTextContent("All specialties");
    expect(
      screen.getByRole("status", { name: "Applied tier" }),
    ).toHaveTextContent("All tiers");
    await user.selectOptions(select, "");
    expect(select).toHaveValue("");
    expect(
      screen.getByRole("status", { name: "Applied sort" }),
    ).toHaveTextContent("Default sort");
  });
}

test("FilterPanel uses updated filters supplied by its parent", async () => {
  const user = userEvent.setup();
  render(<FilterHarness />);
  await user.click(screen.getByRole("button", { name: "Load saved filters" }));
  expect(screen.getByRole("combobox")).toHaveValue("name-asc");
  await user.click(screen.getByRole("button", { name: "Engineering" }));
  expect(
    screen.getByRole("status", { name: "Applied specialty" }),
  ).toHaveTextContent("All specialties");
  expect(
    screen.getByRole("status", { name: "Applied tier" }),
  ).toHaveTextContent("Pro");
  await user.click(screen.getByRole("button", { name: "Pro" }));
  expect(
    screen.getByRole("status", { name: "Applied tier" }),
  ).toHaveTextContent("All tiers");
  expect(screen.getByRole("combobox")).toHaveValue("name-asc");
});
