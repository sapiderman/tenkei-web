// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

const mockRouter = { push: vi.fn(), replace: vi.fn() };
const pathname = { current: "/en/dojos" };
vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => pathname.current,
}));

import LanguageSwitcher from "./LanguageSwitcher";

beforeEach(() => {
  mockRouter.push.mockReset();
  pathname.current = "/en/dojos";
  return () => cleanup();
});

describe("LanguageSwitcher", () => {
  it("toggles the menu via the language button", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher currentLang="en" />);

    const button = screen.getByRole("button", { name: /EN/ });
    expect(button).toHaveAttribute("aria-expanded", "false");

    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menu")).toBeVisible();

    await user.click(button);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("switching language replaces the locale segment and closes the menu", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher currentLang="en" />);

    await user.click(screen.getByRole("button", { name: /EN/ }));
    await user.click(screen.getByRole("menuitem", { name: "日本語" }));

    expect(mockRouter.push).toHaveBeenCalledWith("/ja/dojos");
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("keeps the rest of the path when switching on a nested page", async () => {
    pathname.current = "/en/admin/users/7";
    const user = userEvent.setup();
    render(<LanguageSwitcher currentLang="en" />);

    await user.click(screen.getByRole("button", { name: /EN/ }));
    await user.click(screen.getByRole("menuitem", { name: "Indonesia" }));

    expect(mockRouter.push).toHaveBeenCalledWith("/id/admin/users/7");
  });

  it("prepends the language when the path has no locale segment", async () => {
    pathname.current = "/dojos";
    const user = userEvent.setup();
    render(<LanguageSwitcher currentLang="en" />);

    await user.click(screen.getByRole("button", { name: /EN/ }));
    await user.click(screen.getByRole("menuitem", { name: "日本語" }));

    expect(mockRouter.push).toHaveBeenCalledWith("/ja/dojos");
  });

  it("selecting the current language closes the menu without navigating", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher currentLang="en" />);

    await user.click(screen.getByRole("button", { name: /EN/ }));
    await user.click(screen.getByRole("menuitem", { name: "English" }));

    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("clicking outside closes the menu", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <LanguageSwitcher currentLang="en" />
        <button type="button">outside</button>
      </div>,
    );

    await user.click(screen.getByRole("button", { name: /EN/ }));
    expect(screen.getByRole("menu")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "outside" }));
    expect(screen.queryByRole("menu")).toBeNull();
  });
});
