import { forwardAuthed } from "../../../_lib";

/** PUT /api/admin/attendance/[id]/confirm → PUT /v1/admin/attendance/:id/confirm. */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return forwardAuthed({
    path: `/v1/admin/attendance/${encodeURIComponent(id)}/confirm`,
    request,
    method: "PUT",
    errorKey: "attendance_decide_failed",
  });
}
