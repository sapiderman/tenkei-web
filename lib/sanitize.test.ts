import { describe, it, expect } from "vitest";
import {
  sanitizeDateInput,
  sanitizePasswordInput,
  sanitizePhoneInput,
  sanitizeTextInput,
  sanitizeTextInputForSubmission,
  sanitizeToken,
} from "./sanitize";

describe("lib/sanitize", () => {
  it("strips HTML tags from text inputs", () => {
    // CVE-2026-44990: script content removed entirely (nonTextTags)
    expect(sanitizeTextInput("<script>alert(1)</script>Budhi")).toBe("Budhi");
    expect(sanitizeTextInputForSubmission(" <b>dojo</b> ")).toBe("dojo");
  });

  it("strips control chars and normalizes newlines/tabs", () => {
    // \u0000 (in \u0000-\u0008 range) is stripped, not spaced
    expect(sanitizeTextInput("a\u0000b\tc\nd\u007F")).toBe("ab c d");
  });

  it("allows only phone chars in phone inputs", () => {
    expect(sanitizePhoneInput("+62 812-3456()x")).toBe("+62 812-3456()");
    expect(sanitizePhoneInput("")).toBe("");
  });

  it("allows only digits and dashes in date inputs", () => {
    expect(sanitizeDateInput("2025-02-30")).toBe("2025-02-30");
    expect(sanitizeDateInput("2025/02/30<script>")).toBe("20250230");
  });

  it("trims tokens and strips control chars", () => {
    expect(sanitizeToken("  abc\u0001def  ")).toBe("abcdef");
    expect(sanitizeToken("")).toBe("");
  });

  it("does not mangle plain text or passwords", () => {
    expect(sanitizeTextInput("Budhi Santos")).toBe("Budhi Santos");
    expect(sanitizePasswordInput("p@ss word")).toBe("p@ss word");
  });
});
