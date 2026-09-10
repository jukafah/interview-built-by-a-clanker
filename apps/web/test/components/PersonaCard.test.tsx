import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { PersonaCard } from "~/components/PersonaCard";
import { makePersona } from "../fixtures";
import { renderWithRouter } from "../renderWithRouter";

test("PersonaCard displays the persona summary and monthly price", async () => {
  const persona = makePersona();
  await renderWithRouter(<PersonaCard persona={persona} />);

  expect(
    screen.getByRole("heading", { name: persona.name }),
  ).toBeInTheDocument();
  expect(screen.getByText(persona.tagline)).toBeInTheDocument();
  expect(screen.getByText("Pro")).toBeInTheDocument();
  expect(screen.getByText("4.5")).toBeInTheDocument();
  expect(screen.getByText("(12)")).toBeInTheDocument();
  expect(screen.getByRole("img", { name: persona.name })).toHaveAttribute(
    "src",
    persona.avatarUrl,
  );
  expect(screen.getByRole("link")).toHaveAttribute(
    "href",
    `/personas/${persona.id}`,
  );
  expect(screen.getByText("$49.99", { exact: false })).toHaveTextContent(
    "$49.99/mo",
  );
});

for (const count of [0, 3, 5]) {
  test(`PersonaCard summarizes a list of ${count} capabilities`, async () => {
    const capabilities = Array.from(
      { length: count },
      (_, i) => `Capability ${i + 1}`,
    );
    await renderWithRouter(
      <PersonaCard persona={makePersona({ capabilities })} />,
    );
    expect(screen.queryAllByText(/^Capability \d$/)).toHaveLength(
      Math.min(count, 3),
    );
    for (const capability of capabilities.slice(0, 3)) {
      expect(screen.getByText(capability)).toBeInTheDocument();
    }
    if (count > 3) {
      expect(screen.getByText("+2 more")).toBeInTheDocument();
      expect(screen.queryByText("Capability 4")).not.toBeInTheDocument();
      expect(screen.queryByText("Capability 5")).not.toBeInTheDocument();
    } else {
      expect(screen.queryByText(/\+\d+ more/)).not.toBeInTheDocument();
    }
  });
}

test("PersonaCard opens the matching detail route when clicked", async () => {
  const user = userEvent.setup();
  const router = await renderWithRouter(
    <PersonaCard persona={makePersona()} />,
  );
  await user.click(screen.getByRole("link"));
  expect(await screen.findByText("Persona details")).toBeInTheDocument();
  expect(router.state.location.pathname).toBe("/personas/test-persona");
});

test("PersonaCard opens details using keyboard navigation", async () => {
  const user = userEvent.setup();
  const router = await renderWithRouter(
    <PersonaCard persona={makePersona()} />,
  );
  await user.tab();
  expect(screen.getByRole("link")).toHaveFocus();
  await user.keyboard("{Enter}");
  expect(await screen.findByText("Persona details")).toBeInTheDocument();
  expect(router.state.location.pathname).toBe("/personas/test-persona");
});
