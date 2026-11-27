import { forwardAuthed } from "../admin/_lib";

/** Members may set only these fields; anything else is dropped at the BFF. */
const LOGGABLE_FIELDS = new Set([
  "dojo",
  "instructor",
  "latitude",
  "longitude",
  "location_accuracy_m",
]);

function filterLoggable(body: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!body || typeof body !== "object") return out;
  for (const [key, value] of Object.entries(body)) {
    if (LOGGABLE_FIELDS.has(key)) out[key] = value;
  }
  return out;
}

/** POST /api/attendance → POST /v1/attendance (a member logs a dojo visit). */
export async function POST(request: Request) {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    // Not JSON: forward {} and let the backend answer 400.
  }
  const filtered = new Request(request.url, {
    method: "POST",
    headers: request.headers,
    body: JSON.stringify(filterLoggable(body)),
  });
  return forwardAuthed({
    path: "/v1/attendance",
    request: filtered,
    method: "POST",
    errorKey: "attendance_log_failed",
  });
}

/** GET /api/attendance → GET /v1/attendance/me (own history, newest first). */
export async function GET(request: Request) {
  const { search } = new URL(request.url);
  return forwardAuthed({
    path: `/v1/attendance/me${search}`,
    request,
    errorKey: "attendance_unavailable",
  });
}
