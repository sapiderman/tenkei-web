// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

// next/image needs no runtime behavior in jsdom.
vi.mock("next/image", () => ({
  default: (props: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={props.src} alt={props.alt} />
  ),
}));

import EventAccordion, { type AccordionItem } from "./EventAccordion";

const ITEMS: AccordionItem[] = [
  {
    id: "1",
    title: "Enbukai",
    description: "Annual demonstration.",
    imageUrl: "/a.jpg",
    altText: "Enbukai demo",
  },
  {
    id: "2",
    title: "Family",
    description: "Gathering and food.",
    imageUrl: "/b.jpg",
    altText: "Family gathering",
  },
  {
    id: "3",
    title: "Seminar",
    description: "Guest teacher.",
    imageUrl: "/c.jpg",
    altText: "Seminar practice",
  },
];

beforeEach(() => {
  return () => cleanup();
});

describe("EventAccordion", () => {
  it("activates the first item by default", () => {
    render(<EventAccordion items={ITEMS} />);

    expect(
      screen.getByRole("button", { name: "Show details for Enbukai" }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("button", { name: "Show details for Family" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("Annual demonstration.")).toBeVisible();
  });

  it("clicking a panel activates it and collapses the previous one", async () => {
    const user = userEvent.setup();
    render(<EventAccordion items={ITEMS} />);

    await user.click(
      screen.getByRole("button", { name: "Show details for Family" }),
    );

    expect(
      screen.getByRole("button", { name: "Show details for Family" }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("button", { name: "Show details for Enbukai" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.getByRole("button", { name: "Show details for Seminar" }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("renders one image and title per item", () => {
    const { container } = render(<EventAccordion items={ITEMS} />);

    for (const item of ITEMS) {
      expect(screen.getByText(item.title)).toBeVisible();
    }
    expect(container.querySelectorAll("img")).toHaveLength(ITEMS.length);
  });
});
