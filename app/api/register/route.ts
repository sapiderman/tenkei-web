import { NextResponse } from "next/server";

// Allowed values for rank dropdown
const VALID_RANKS = [
  "10th Kyu",
  "9th Kyu",
  "8th Kyu",
  "7th Kyu",
  "6th Kyu",
  "5th Kyu",
  "4th Kyu",
  "3rd Kyu",
  "2nd Kyu",
  "1st Kyu",
  "Shodan (1st Dan)",
  "Nidan (2nd Dan)",
  "Sandan (3rd Dan)",
  "Yondan (4th Dan)",
  "Godan (5th Dan)",
];

// Sanitize string input - remove potential XSS/injection characters
function sanitizeString(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove HTML brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, ""); // Remove event handlers like onclick=
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone number format (international)
function isValidPhone(phone: string): boolean {
  // Accepts formats like: +1234567890, 1234567890, +62 812 3456 7890
  // Must have 7-15 digits, optionally starting with +
  const cleaned = phone.replace(/[\s\-().]/g, "");
  const phoneRegex = /^\+?\d{7,15}$/;
  return phoneRegex.test(cleaned);
}

// Validate date format (YYYY-MM-DD)
function isValidDate(dateStr: string): boolean {
  if (!dateStr) return true; // Optional field
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) && date <= new Date();
}

// Verify Cloudflare Turnstile token
async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    console.error("TURNSTILE_SECRET_KEY not configured");
    return false;
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: secretKey,
          response: token,
        }),
      }
    );
    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return false;
  }
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
  const TARGET_API_URL = process.env.BE_API_URL || "example.com/api/register";

  try {
    const body: RegistrationBody = await request.json();

    // === SERVER-SIDE VALIDATION ===

    // 1. Verify Turnstile token first (anti-bot protection)
    const turnstileToken = body["cf-turnstile-response"];
    if (typeof turnstileToken !== "string" || !turnstileToken) {
      return NextResponse.json(
        { error: "Security verification required" },
        { status: 400 }
      );
    }

    const isValidToken = await verifyTurnstileToken(turnstileToken);
    if (!isValidToken) {
      return NextResponse.json(
        { error: "Security verification failed. Please try again." },
        { status: 400 }
      );
    }

    // 2. Sanitize and validate all string inputs
    const name = sanitizeString(body.name);
    const email = sanitizeString(body.email);
    const whatsapp = sanitizeString(body.whatsapp);
    const dateOfBirth = sanitizeString(body.date_of_birth);
    const password = typeof body.password === "string" ? body.password : "";
    const passwordConfirm =
      typeof body.password_confirm === "string" ? body.password_confirm : "";
    const dojo = sanitizeString(body.dojo);
    const rank = sanitizeString(body.rank);
    const lastGradingDate = sanitizeString(body.last_grading_date);
    const emergencyContactName = sanitizeString(body.emergency_contact_name);
    const emergencyContactNumber = sanitizeString(body.emergency_contact_number);
    const medicalConditions = sanitizeString(body.medical_conditions);
    const consentDatastore = body.consent_datastore === true;
    const consentMarketing = body.consent_marketing === true;

    // 3. Required field validation
    if (!name || name.length < 1) {
      return NextResponse.json(
        { error: "Full name is required" },
        { status: 400 }
      );
    }

    if (!whatsapp) {
      return NextResponse.json(
        { error: "WhatsApp number is required" },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    if (!consentDatastore) {
      return NextResponse.json(
        { error: "You must consent to data storage to register" },
        { status: 400 }
      );
    }

    // 4. Length validation (prevent payload attacks)
    if (name.length > 100) {
      return NextResponse.json(
        { error: "Name is too long (max 100 characters)" },
        { status: 400 }
      );
    }

    if (email.length > 100) {
      return NextResponse.json(
        { error: "Email is too long (max 100 characters)" },
        { status: 400 }
      );
    }

    if (whatsapp.length > 20) {
      return NextResponse.json(
        { error: "WhatsApp number is too long" },
        { status: 400 }
      );
    }

    if (password.length > 128) {
      return NextResponse.json(
        { error: "Password is too long (max 128 characters)" },
        { status: 400 }
      );
    }

    if (emergencyContactName.length > 100) {
      return NextResponse.json(
        { error: "Emergency contact name is too long (max 100 characters)" },
        { status: 400 }
      );
    }

    if (emergencyContactNumber.length > 20) {
      return NextResponse.json(
        { error: "Emergency contact number is too long" },
        { status: 400 }
      );
    }

    if (medicalConditions.length > 500) {
      return NextResponse.json(
        { error: "Medical conditions text is too long (max 500 characters)" },
        { status: 400 }
      );
    }

    // 5. Format validation
    if (email && !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    if (!isValidPhone(whatsapp)) {
      return NextResponse.json(
        { error: "Please enter a valid WhatsApp number (e.g. 0812...)" },
        { status: 400 }
      );
    }

    if (emergencyContactNumber && !isValidPhone(emergencyContactNumber)) {
      return NextResponse.json(
        { error: "Please enter a valid emergency contact number" },
        { status: 400 }
      );
    }

    if (!isValidDate(dateOfBirth)) {
      return NextResponse.json(
        { error: "Please enter a valid date of birth" },
        { status: 400 }
      );
    }

    if (!isValidDate(lastGradingDate)) {
      return NextResponse.json(
        { error: "Please enter a valid last grading date" },
        { status: 400 }
      );
    }

    // 6. Password validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (password !== passwordConfirm) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
    }

    // 7. Validate dojo and rank
    if (dojo.length > 100) {
      return NextResponse.json(
        { error: "Dojo name is too long (max 100 characters)" },
        { status: 400 }
      );
    }

    if (rank && !VALID_RANKS.includes(rank)) {
      return NextResponse.json(
        { error: "Please select a valid rank" },
        { status: 400 }
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
      { status: 500 }
    );
  }
}
