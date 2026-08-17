import { forwardAuthed } from "../../../_lib";

/** POST /api/admin/users/[id]/verify → POST /v1/admin/users/:id/verify (new→user). */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return forwardAuthed({
    path: `/v1/admin/users/${encodeURIComponent(id)}/verify`,
    request,
    method: "POST",
    errorKey: "verify_failed",
  });
}
