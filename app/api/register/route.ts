import { NextResponse } from "next/server";
import sanitizeHtml from "sanitize-html";
import { isRateLimited, isValidTurnstileToken } from "../auth/_lib";
import { VALID_RANKS } from "@/lib/constants";
import {
  isValidDate,
  isValidEmail,
  isValidPhone,
  MAX_LENGTHS,
} from "@/lib/validation";

/**
 * Sanitize string input to prevent basic XSS and injection attacks.
 * Returns an empty string if input is not a string or is undefined.
 */
function sanitizeString(input: unknown): string {
  if (typeof input !== "string") {
    return "";
  }

  const trimmed = input.trim();
  // Use sanitize-html to strip all HTML tags
  const cleaned = sanitizeHtml(trimmed, {
    allowedTags: [],
    allowedAttributes: {},
    // CVE-2026-44990: xmp must be in nonTextTags to prevent raw-text passthrough XSS bypass
    nonTextTags: ["script", "style", "textarea", "option", "xmp"],
  });
  // Normalize control characters to mitigate header/log injection vectors
  return cleaned
    .replace(/\r?\n/g, " ")
    .replace(/\t/g, " ")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]+/g, "");
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
  cf_turnstile_response?: unknown;
}

export async function POST(request: Request) {
  const BE_API_BASE = process.env.BE_API_BASE;
  if (!BE_API_BASE) {
    console.error("Server configuration error: BE_API_BASE is missing");
    return NextResponse.json(
      { error: "Internal server configuration error" },
      { status: 500 },
    );
  }
  const TARGET_API_URL = `${BE_API_BASE.replace(/\/+$/, "")}/v1/register`;

  try {
    if (isRateLimited(request, "register").limited) {
      return NextResponse.json(
        {
          error:
            "Too many registration attempts. Please wait a few minutes before trying again.",
        },
        { status: 429 },
      );
    }

    const body: RegistrationBody = await request.json();

    // 1. Get turnstile token (use underscore key)
    const rawTurnstileToken = body["cf_turnstile_response"];
    const turnstileToken =
      typeof rawTurnstileToken === "string" ? rawTurnstileToken.trim() : "";

    if (!turnstileToken) {
      return NextResponse.json(
        { error: "Security verification required" },
        { status: 400 },
      );
    }

    // Validate turnstile token format
    if (!isValidTurnstileToken(turnstileToken)) {
      return NextResponse.json(
        { error: "Invalid security verification token" },
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

    // 3. Required field validation (whatsapp is optional now)
    if (!name || name.length < 1) {
      return NextResponse.json(
        { error: "Full name is required" },
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
    if (name.length > MAX_LENGTHS.name) {
      return NextResponse.json(
        { error: `Name is too long (max ${MAX_LENGTHS.name} characters)` },
        { status: 400 },
      );
    }

    // Standard email max length in databases is often 255, but 100 is safe strict limit for this app
    if (email.length > MAX_LENGTHS.email) {
      return NextResponse.json(
        { error: `Email is too long (max ${MAX_LENGTHS.email} characters)` },
        { status: 400 },
      );
    }

    if (whatsapp.length > MAX_LENGTHS.whatsapp) {
      return NextResponse.json(
        {
          error: `WhatsApp number is too long (max ${MAX_LENGTHS.whatsapp} characters)`,
        },
        { status: 400 },
      );
    }

    if (password.length > MAX_LENGTHS.password) {
      return NextResponse.json(
        {
          error: `Password is too long (max ${MAX_LENGTHS.password} characters)`,
        },
        { status: 400 },
      );
    }

    if (emergencyContactName.length > MAX_LENGTHS.emergencyContactName) {
      return NextResponse.json(
        {
          error: `Emergency contact name is too long (max ${MAX_LENGTHS.emergencyContactName} characters)`,
        },
        { status: 400 },
      );
    }

    if (emergencyContactNumber.length > MAX_LENGTHS.emergencyContactNumber) {
      return NextResponse.json(
        {
          error: `Emergency contact number is too long (max ${MAX_LENGTHS.emergencyContactNumber} characters)`,
        },
        { status: 400 },
      );
    }

    if (medicalConditions.length > MAX_LENGTHS.medicalConditions) {
      return NextResponse.json(
        {
          error: `Medical conditions text is too long (max ${MAX_LENGTHS.medicalConditions} characters)`,
        },
        { status: 400 },
      );
    }

    if (dojo.length > MAX_LENGTHS.dojo) {
      return NextResponse.json(
        { error: `Dojo name is too long (max ${MAX_LENGTHS.dojo} characters)` },
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

    if (whatsapp && !isValidPhone(whatsapp)) {
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
      password_confirm: passwordConfirm,
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

    // Forward relevant headers to backend
    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    headers.set("Accept", "application/json");
    const bypassSecret = process.env.CLOUDFLARE_BYPASS_SECRET;
    if (!bypassSecret) {
      console.error(
        "Server configuration error: CLOUDFLARE_BYPASS_SECRET is missing",
      );
      return NextResponse.json(
        { error: "Internal server configuration error" },
        { status: 500 },
      );
    }
    headers.set("x-cf-bypass", bypassSecret);

    const userAgent = request.headers.get("user-agent");
    if (userAgent) headers.set("User-Agent", userAgent);

    const acceptLanguage = request.headers.get("accept-language");
    if (acceptLanguage) headers.set("Accept-Language", acceptLanguage);

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    let response: Response;
    try {
      response = await fetch(TARGET_API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(sanitizedPayload),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    // Handle non-JSON responses gracefully
    const responseText = await response.text();
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(responseText);
    } catch {
      // Response was not JSON
      data = { rawResponse: responseText };
    }

    // Log backend errors for debugging in Vercel logs. Avoid logging raw payloads verbatim.
    if (!response.ok) {
      const errorDetail =
        typeof data.error === "string"
          ? data.error
          : typeof data.message === "string"
            ? data.message
            : typeof data.detail === "string"
              ? data.detail
              : responseText || "Unknown backend error";

      const truncatedResponseText =
        responseText.length > 1000
          ? `${responseText.slice(0, 1000)}... (truncated)`
          : responseText;

      console.error("Backend registration error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorDetail,
        responseText: truncatedResponseText,
        targetUrl: TARGET_API_URL,
      });
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    // Avoid logging the entire error object if it could contain sensitive env vars or stack traces in production.
    if (error instanceof Error) {
      console.error("Registration proxy error:", {
        message: error.message,
        stack: error.stack?.split("\n").slice(0, 8).join("\n"),
      });
    } else {
      console.error("Registration proxy error: unexpected non-error thrown", {
        error,
      });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred during registration." },
      { status: 500 },
    );
  }
}
