import { forwardAuthed } from "../../admin/_lib";

/** GET /api/attendance/instructors → GET /v1/attendance/instructors. */
export async function GET(request: Request) {
  return forwardAuthed({
    path: "/v1/attendance/instructors",
    request,
    errorKey: "instructors_unavailable",
  });
}
