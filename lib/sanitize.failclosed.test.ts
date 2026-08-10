import { describe, it, expect, vi } from "vitest";

vi.mock("sanitize-html", () => ({
  default: vi.fn(() => {
    throw new Error("sanitize-html failed");
  }),
}));

// Isolated file: sanitize-html is mocked to throw so we can pin the
// fail-closed behavior (CodeQL: incomplete multi-char sanitization fallback).
import {
  sanitizeTextInput,
  sanitizeTextInputForSubmission,
} from "./sanitize";

describe("lib/sanitize fail-closed", () => {
  it("drops the value when sanitize-html throws", () => {
    expect(sanitizeTextInput('<script>alert(1)</script>')).toBe("");
    expect(sanitizeTextInput("<script")).toBe("");
    expect(sanitizeTextInputForSubmission(" <b>dojo</b> ")).toBe("");
  });
});
