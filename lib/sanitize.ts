/**
 * Shared input sanitization — used by both the register form and the profile
 * edit form. Strip HTML/control chars at the input edge before validation and
 * submission.
 */
import sanitizeHtml from "sanitize-html";

const SANITIZE_OPTIONS = {
  allowedTags: [],
  allowedAttributes: {},
  // CVE-2026-44990: xmp must be in nonTextTags to prevent raw-text passthrough XSS bypass
  nonTextTags: ["script", "style", "textarea", "option", "xmp"],
};

const stripControlChars = (value: string) =>
  value
    .replace(/\r?\n/g, " ")
    .replace(/\t/g, " ")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]+/g, "");

const safeSanitize = (value: string) => {
  if (typeof value !== "string") return "";
  try {
    return sanitizeHtml(value, SANITIZE_OPTIONS);
  } catch {
    // Fallback: strip HTML tags manually if sanitize-html throws
    return value.replace(/<[^>]*>/g, "");
  }
};

export const sanitizeTextInput = (value: string) =>
  stripControlChars(safeSanitize(value));

export const sanitizeTextInputForSubmission = (value: string) =>
  stripControlChars(safeSanitize(value.trim()));

export const sanitizePhoneInput = (value: string) =>
  stripControlChars(value.replace(/[^\d+\s().-]/g, "").trim());

export const sanitizeDateInput = (value: string) =>
  stripControlChars(value.replace(/[^0-9-]/g, "").trim());

export const sanitizePasswordInput = (value: string) =>
  stripControlChars(value);

export const sanitizeToken = (value: string) => {
  if (typeof value !== "string" || !value) return "";
  return stripControlChars(value.trim());
};
