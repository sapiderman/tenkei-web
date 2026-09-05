/**
 * Shared input validation — single source of truth for both the server route
 * handler (app/api/register/route.ts) and the client form
 * (components/RegisterForm.tsx). Keep client and server in sync by editing here.
 */

/** Maximum field lengths — enforced on both client (UX) and server (security). */
export const MAX_LENGTHS = {
  name: 100,
  email: 100,
  whatsapp: 20,
  password: 128,
  emergencyContactName: 100,
  emergencyContactNumber: 20,
  medicalConditions: 500,
  dojo: 100,
  faculty: 100,
  major: 100,
} as const;

/**
 * Max lengths for the profile EDIT form — mirrors the backend's PUT
 * /v1/auth/profile update caps (tenkei-register auth/model.go), which are
 * looser than registration. Separate from MAX_LENGTHS so registration keeps
 * its stricter caps (register.go caps emergency_contact_number at 20).
 */
export const EDIT_MAX_LENGTHS = {
  name: 255,
  dojo: 255,
  faculty: 100,
  major: 100,
  whatsapp: 20,
  emergencyContactName: 255,
  emergencyContactNumber: 50,
  medicalConditions: 2000,
} as const;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_REGEX = /^\+?\d{7,15}$/;

/** Validates email format. TLD must be at least 2 chars (no single-char TLDs exist). */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/**
 * Validates phone number format. Accepts international formats; strips spaces,
 * hyphens, parentheses and dots before checking. Min 7 digits, max 15 (E.164).
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-().]/g, "");
  return PHONE_REGEX.test(cleaned);
}

/**
 * Validates a YYYY-MM-DD date: must be a real calendar date and not in the
 * future. Empty string is allowed (optional fields).
 */
export function isValidDate(dateStr: string): boolean {
  if (!dateStr) return true; // optional field

  const matches = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(dateStr);
  if (!matches) {
    return false;
  }

  const year = Number(matches[1]);
  const month = Number(matches[2]);
  const day = Number(matches[3]);

  const candidate = new Date(year, month - 1, day);
  if (
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== day
  ) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return candidate <= today;
}
