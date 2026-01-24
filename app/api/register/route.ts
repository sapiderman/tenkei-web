import { NextResponse } from "next/server";
import { filterXSS } from "xss";
import { VALID_RANKS } from "@/lib/constants";

/**
 * Sanitize string input to prevent basic XSS and injection attacks.
 * Returns an empty string if input is not a string or is undefined.
 */
function sanitizeString(input: unknown): string {
  if (typeof input !== "string") {
    return "";
  }

  const trimmed = input.trim();
  // Use xss library to strip all HTML tags (whitelist: {})

  const cleaned = filterXSS(trimmed, {
    whiteList: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: ["script", "style"],
  });
  // Normalise control characters to mitigate header/log injection vectors
  return cleaned
    .replace(/\r?\n/g, " ")
    .replace(/\t/g, " ")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]+/g, "");
}

/**
 * Validates email format using a standard regex.
 */
function isValidEmail(email: string): boolean {
  // Regex:
  // 1. No whitespace or @ in local part
  // 2. @ symbol
  // 3. No whitespace or @ in domain part
  // 4. Dot
  // 5. At least 2 chars for TLD
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Validates phone number format.
 * Accepts international formats, strips formatting chars before check.
 * Min 7 digits, Max 15 digits (E.164 standard is max 15).
 */
function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  // Remove spaces, hyphens, parentheses, and dots
  const cleaned = phone.replace(/[\s\-().]/g, "");
  // Optional '+' followed by 7 to 15 digits
  const phoneRegex = /^\+?\d{7,15}$/;
  return phoneRegex.test(cleaned);
}

/**
 * Validates date format (YYYY-MM-DD).
 * Checks if it's a valid date and not in the future.
 */
function isValidDate(dateStr: string): boolean {
  if (!dateStr) return true; // Optional field

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

interface RegistrationBody {
  name?: unknown;
  email?: unknown;
  whatsapp?: unknown;
  date_of_birth?: unknown;
  password?: unknown;
  password_confirm?: unknown;
  dojo?: unknown;
  rank?: unknown;
  last_grading_date?: unknown;
  emergency_contact_name?: unknown;
  emergency_contact_number?: unknown;
  medical_conditions?: unknown;
  consent_datastore?: unknown;
  consent_marketing?: unknown;
  "cf-turnstile-response"?: unknown;
}

export async function POST(request: Request) {
  const TARGET_API_URL = process.env.BE_API_URL;

  if (!TARGET_API_URL) {
    console.error("Server configuration error: BE_API_URL is missing");
    return NextResponse.json(
      { error: "Internal server configuration error" },
      { status: 500 },
    );
  }

  try {
    const body: RegistrationBody = await request.json();

    // 1. Get turnstile token
    const rawTurnstileToken = body["cf-turnstile-response"];
    const turnstileToken =
      typeof rawTurnstileToken === "string" ? rawTurnstileToken.trim() : "";

    if (!turnstileToken) {
      return NextResponse.json(
        { error: "Security verification required" },
        { status: 400 },
      );
    }

    // 2. Sanitize and validate all string inputs
    // We treat everything as unknown first, then sanitize to guaranteed strings
    const name = sanitizeString(body.name);
    const email = sanitizeString(body.email);
    const whatsapp = sanitizeString(body.whatsapp);
    const dateOfBirth = sanitizeString(body.date_of_birth);
    // Passwords are NOT sanitized (special chars are valid), but type checked
    const password = typeof body.password === "string" ? body.password : "";
    const passwordConfirm =
      typeof body.password_confirm === "string" ? body.password_confirm : "";

    // Dojo: Allow custom names, just sanitize
    const dojo = sanitizeString(body.dojo);

    const rank = sanitizeString(body.rank);
    const lastGradingDate = sanitizeString(body.last_grading_date);
    const emergencyContactName = sanitizeString(body.emergency_contact_name);
    const emergencyContactNumber = sanitizeString(
      body.emergency_contact_number,
    );
    const medicalConditions = sanitizeString(body.medical_conditions);

    // Booleans
    const consentDatastore = body.consent_datastore === true;
    const consentMarketing = body.consent_marketing === true;

    // 3. Required field validation
    if (!name || name.length < 1) {
      return NextResponse.json(
        { error: "Full name is required" },
        { status: 400 },
      );
    }

    if (!whatsapp) {
      return NextResponse.json(
        { error: "WhatsApp number is required" },
        { status: 400 },
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 },
      );
    }

    if (!consentDatastore) {
      return NextResponse.json(
        { error: "You must consent to data storage to register" },
        { status: 400 },
      );
    }

    // 4. Length validation (prevent payload attacks / DB truncation issues)
    if (name.length > 100) {
      return NextResponse.json(
        { error: "Name is too long (max 100 characters)" },
        { status: 400 },
      );
    }

    // Standard email max length in databases is often 255, but 100 is safe strict limit for this app
    if (email.length > 100) {
      return NextResponse.json(
        { error: "Email is too long (max 100 characters)" },
        { status: 400 },
      );
    }

    if (whatsapp.length > 20) {
      return NextResponse.json(
        { error: "WhatsApp number is too long" },
        { status: 400 },
      );
    }

    if (password.length > 128) {
      return NextResponse.json(
        { error: "Password is too long (max 128 characters)" },
        { status: 400 },
      );
    }

    if (emergencyContactName.length > 100) {
      return NextResponse.json(
        { error: "Emergency contact name is too long (max 100 characters)" },
        { status: 400 },
      );
    }

    if (emergencyContactNumber.length > 20) {
      return NextResponse.json(
        { error: "Emergency contact number is too long" },
        { status: 400 },
      );
    }

    if (medicalConditions.length > 500) {
      return NextResponse.json(
        { error: "Medical conditions text is too long (max 500 characters)" },
        { status: 400 },
      );
    }

    if (dojo.length > 100) {
      return NextResponse.json(
        { error: "Dojo name is too long (max 100 characters)" },
        { status: 400 },
      );
    }

    // 5. Format validation
    if (email && !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 },
      );
    }

    if (!isValidPhone(whatsapp)) {
      return NextResponse.json(
        { error: "Please enter a valid WhatsApp number (e.g. 0812...)" },
        { status: 400 },
      );
    }

    if (emergencyContactNumber && !isValidPhone(emergencyContactNumber)) {
      return NextResponse.json(
        { error: "Please enter a valid emergency contact number" },
        { status: 400 },
      );
    }

    if (!isValidDate(dateOfBirth)) {
      return NextResponse.json(
        { error: "Please enter a valid date of birth" },
        { status: 400 },
      );
    }

    if (!isValidDate(lastGradingDate)) {
      return NextResponse.json(
        { error: "Please enter a valid last grading date" },
        { status: 400 },
      );
    }

    // 6. Password validation (Length ONLY, as per current best practices if not strict)
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    if (password !== passwordConfirm) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 },
      );
    }

    // 7. Validate dojo and rank
    // Dojo can be anything, but we already length checked it above (>100)
    if (rank && !VALID_RANKS.includes(rank)) {
      return NextResponse.json(
        { error: "Please select a valid rank" },
        { status: 400 },
      );
    }

    // === BUILD SANITIZED PAYLOAD ===
    // Only include whitelisted fields (prevent extra field injection)
    const sanitizedPayload = {
      name,
      email,
      whatsapp,
      date_of_birth: dateOfBirth,
      password,
      dojo,
      rank,
      last_grading_date: lastGradingDate,
      emergency_contact_name: emergencyContactName,
      emergency_contact_number: emergencyContactNumber,
      medical_conditions: medicalConditions,
      consent_datastore: consentDatastore,
      consent_marketing: consentMarketing,
      cf_turnstile_response: turnstileToken, 
    };

    const response = await fetch(TARGET_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sanitizedPayload),
    });

    // Handle non-JSON responses gracefully
    const data = await response.json().catch(() => ({}));

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Registration proxy error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration." },
      { status: 500 },
    );
  }
}
