import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { StarRating } from "~/components/StarRating";

test("StarRating displays five stars and a one-decimal rating", () => {
  const { container } = render(<StarRating rating={4} />);

  expect(screen.getByText("4.0")).toBeInTheDocument();
  expect(container.querySelectorAll("svg")).toHaveLength(5);
});

for (const size of ["sm", "md"] as const) {
  for (const { rating, full, partial, empty } of [
    { rating: 1, full: 1, partial: 0, empty: 4 },
    { rating: 4.5, full: 4, partial: 1, empty: 0 },
    { rating: 5, full: 5, partial: 0, empty: 0 },
  ]) {
    test(`StarRating represents ${rating} out of five at ${size} size`, () => {
      const { container } = render(<StarRating rating={rating} size={size} />);
      expect(screen.getByText(rating.toFixed(1))).toBeInTheDocument();
      expect(container.querySelectorAll("svg")).toHaveLength(5);
      expect(
        container.querySelectorAll('svg[fill="currentColor"]'),
      ).toHaveLength(full);
      expect(container.querySelectorAll('svg[fill^="url("]')).toHaveLength(
        partial,
      );
      expect(container.querySelectorAll('svg[fill="none"]')).toHaveLength(
        empty,
      );
      if (partial) {
        const stops = container.querySelectorAll("linearGradient stop");
        expect(stops).toHaveLength(2);
        for (const stop of stops) expect(stop).toHaveAttribute("offset", "50%");
      }
    });
  }
}

test("StarRating updates its numeric label and star fills when the rating changes", () => {
  const { container, rerender } = render(<StarRating rating={1} />);
  rerender(<StarRating rating={3.5} />);
  expect(screen.queryByText("1.0")).not.toBeInTheDocument();
  expect(screen.getByText("3.5")).toBeInTheDocument();
  expect(container.querySelectorAll('svg[fill="currentColor"]')).toHaveLength(
    3,
  );
  expect(container.querySelectorAll('svg[fill^="url("]')).toHaveLength(1);
  expect(container.querySelectorAll('svg[fill="none"]')).toHaveLength(1);
});
