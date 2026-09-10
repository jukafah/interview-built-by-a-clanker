import { useState } from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { CartItem } from "~/components/CartItem";
import { makeCartItem } from "../fixtures";
import { renderWithRouter } from "../renderWithRouter";

function CartHarness({ initialQuantity = 2 }: { initialQuantity?: number }) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [present, setPresent] = useState(true);
  return present ? (
    <>
      <CartItem
        item={makeCartItem({ quantity })}
        onUpdateQuantity={setQuantity}
        onRemove={() => setPresent(false)}
      />
      <button onClick={() => setQuantity(4)}>Restore saved quantity</button>
    </>
  ) : (
    <p>Cart is empty</p>
  );
}

test("CartItem displays persona details, quantity, and prices", async () => {
  const item = makeCartItem();
  await renderWithRouter(<CartHarness />);

  expect(screen.getByText(item.persona.name)).toBeInTheDocument();
  expect(screen.getByText(item.persona.tagline)).toBeInTheDocument();
  expect(screen.getByRole("img", { name: item.persona.name })).toHaveAttribute(
    "src",
    item.persona.avatarUrl,
  );
  expect(screen.getByText("2")).toBeInTheDocument();
  expect(screen.getByText("$49.99/mo")).toBeInTheDocument();
  expect(screen.getByText("$99.98")).toBeInTheDocument();
  for (const link of screen.getAllByRole("link")) {
    expect(link).toHaveAttribute("href", `/personas/${item.personaId}`);
  }
});

test("CartItem updates the displayed quantity and total through its parent", async () => {
  const user = userEvent.setup();
  await renderWithRouter(<CartHarness />);
  await user.click(screen.getByRole("button", { name: "+" }));
  expect(screen.getByText("3")).toBeInTheDocument();
  expect(screen.getByText("$149.97")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "-" }));
  expect(screen.getByText("2")).toBeInTheDocument();
  expect(screen.getByText("$99.98")).toBeInTheDocument();
});

test("CartItem preserves the minimum quantity of one", async () => {
  const user = userEvent.setup();
  await renderWithRouter(<CartHarness initialQuantity={1} />);
  await user.click(screen.getByRole("button", { name: "-" }));
  expect(screen.getByText("1")).toBeInTheDocument();
  expect(screen.getByText("$49.99", { exact: true })).toBeInTheDocument();
});

test("CartItem removes the item from its parent with keyboard activation", async () => {
  const user = userEvent.setup();
  await renderWithRouter(<CartHarness />);
  screen.getByRole("button", { name: "Remove" }).focus();
  await user.keyboard("{Enter}");
  expect(screen.getByText("Cart is empty")).toBeInTheDocument();
  expect(screen.queryByText("Review Assistant")).not.toBeInTheDocument();
});

test("CartItem reflects quantity changes made by its parent", async () => {
  const user = userEvent.setup();
  await renderWithRouter(<CartHarness />);
  await user.click(
    screen.getByRole("button", { name: "Restore saved quantity" }),
  );
  expect(screen.getByText("4")).toBeInTheDocument();
  expect(screen.getByText("$199.96")).toBeInTheDocument();
});

for (const [index, label] of ["image", "name"].entries()) {
  test(`CartItem opens persona details through its ${label} link`, async () => {
    const user = userEvent.setup();
    const router = await renderWithRouter(<CartHarness />);
    await user.click(screen.getAllByRole("link")[index]);
    expect(await screen.findByText("Persona details")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/personas/test-persona");
  });
}
