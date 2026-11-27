import { forwardAuthed } from "../_lib";

/** GET /api/admin/attendance → GET /v1/admin/attendance (dojo, q, status, from, to, page, size). */
export async function GET(request: Request) {
  const { search } = new URL(request.url);
  return forwardAuthed({
    path: `/v1/admin/attendance${search}`,
    request,
    errorKey: "attendance_unavailable",
  });
}
