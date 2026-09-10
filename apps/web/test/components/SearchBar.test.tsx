import { useState } from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { SearchBar } from "~/components/SearchBar";

function SearchHarness({ controls = false }: { controls?: boolean }) {
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(true);

  return (
    <>
      {visible && <SearchBar value={query} onChange={setQuery} />}
      <output aria-label="Applied search">{query}</output>
      {controls && (
        <>
          <button onClick={() => setQuery("saved query")}>
            Use saved search
          </button>
          <button onClick={() => setVisible(false)}>Hide search</button>
        </>
      )}
    </>
  );
}

test("SearchBar applies the latest search after typing pauses and clears it", async () => {
  const user = userEvent.setup();
  render(<SearchHarness />);

  const input = screen.getByRole("textbox");
  const appliedSearch = screen.getByRole("status", { name: "Applied search" });

  await user.type(input, "code");
  await user.type(input, " review");

  // Typing updates the input immediately, but the parent waits for a pause.
  expect(input).toHaveValue("code review");
  expect(appliedSearch).toBeEmptyDOMElement();
  await waitFor(() => {
    expect(appliedSearch).toHaveTextContent(/^code review$/);
  });

  await user.click(screen.getByRole("button"));
  expect(input).toHaveValue("");
  expect(appliedSearch).toBeEmptyDOMElement();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

// Direct input events give timer-boundary tests exact control over elapsed time.
// The full typing/clicking flow above uses user-event with real timers.
async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

test("SearchBar waits 300 ms after the most recent edit before applying it", async () => {
  vi.useFakeTimers();
  render(<SearchHarness />);
  const input = screen.getByRole("textbox");
  const applied = screen.getByRole("status", { name: "Applied search" });
  fireEvent.change(input, { target: { value: "code" } });
  await advance(200);
  fireEvent.change(input, { target: { value: "code review" } });
  await advance(299);
  expect(input).toHaveValue("code review");
  expect(applied).toBeEmptyDOMElement();
  await advance(1);
  expect(applied).toHaveTextContent(/^code review$/);
});

test("SearchBar follows a parent value change while an edit is pending", async () => {
  vi.useFakeTimers();
  render(<SearchHarness controls />);
  const input = screen.getByRole("textbox");
  fireEvent.change(input, { target: { value: "draft query" } });
  await advance(100);
  fireEvent.click(screen.getByRole("button", { name: "Use saved search" }));
  expect(input).toHaveValue("saved query");
  await advance(300);
  expect(input).toHaveValue("saved query");
  expect(
    screen.getByRole("status", { name: "Applied search" }),
  ).toHaveTextContent(/^saved query$/);
});

test("SearchBar cancels pending work when its parent hides it", async () => {
  vi.useFakeTimers();
  render(<SearchHarness controls />);
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "pending query" },
  });
  await advance(100);
  fireEvent.click(screen.getByRole("button", { name: "Hide search" }));
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  await advance(300);
  expect(
    screen.getByRole("status", { name: "Applied search" }),
  ).toBeEmptyDOMElement();
});

test("SearchBar clears a pending edit without applying it later", async () => {
  vi.useFakeTimers();
  render(<SearchHarness />);
  const input = screen.getByRole("textbox");
  fireEvent.change(input, { target: { value: "pending query" } });
  await advance(100);
  fireEvent.click(screen.getByRole("button"));
  expect(input).toHaveValue("");
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  await advance(300);
  expect(input).toHaveValue("");
  expect(
    screen.getByRole("status", { name: "Applied search" }),
  ).toBeEmptyDOMElement();
});
