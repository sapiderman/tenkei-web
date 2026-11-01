// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

import PasswordInput from "./PasswordInput";

beforeEach(() => {
  return () => cleanup();
});

function renderInput(disabled?: boolean) {
  return render(
    <>
      <label htmlFor="pw">pw</label>
      <PasswordInput
        id="pw"
        showLabel="show_password"
        hideLabel="hide_password"
        disabled={disabled}
      />
    </>,
  );
}

describe("PasswordInput", () => {
  it("toggles between masked and visible, swapping the toggle label", async () => {
    const user = userEvent.setup();
    renderInput();

    const input = screen.getByLabelText("pw");
    expect(input).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "show_password" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "show_password" }));
    expect(input).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "hide_password" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "hide_password" }));
    expect(input).toHaveAttribute("type", "password");
  });

  it("disables both the input and the toggle", () => {
    renderInput(true);
    expect(screen.getByLabelText("pw")).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "show_password" }),
    ).toBeDisabled();
  });
});
