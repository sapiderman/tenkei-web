// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import type { ReactNode } from "react";
import "@testing-library/jest-dom/vitest";

vi.mock("@/app/i18n/client", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import JoinButton from "./joinButton";

function clearSessionCookie() {
  document.cookie = "tenkei_session=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

beforeEach(() => {
  clearSessionCookie();
  return () => cleanup();
});

afterEach(() => {
  clearSessionCookie();
});

describe("JoinButton session CTA", () => {
  it("signed out: links to login", () => {
    render(<JoinButton lang="en" />);

    expect(screen.getByRole("link", { name: "join_now" })).toHaveAttribute(
      "href",
      "/en/register",
    );
    expect(screen.getByRole("link", { name: "sign_in" })).toHaveAttribute(
      "href",
      "/en/login",
    );
  });

  it("with a session cookie: links to the profile", () => {
    document.cookie = "tenkei_session=abc123";
    render(<JoinButton lang="en" />);

    expect(screen.getByRole("link", { name: "my_profile" })).toHaveAttribute(
      "href",
      "/en/profile",
    );
    expect(screen.queryByRole("link", { name: "sign_in" })).toBeNull();
  });
});
