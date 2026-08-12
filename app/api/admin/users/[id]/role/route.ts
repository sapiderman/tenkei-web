import { forwardAuthed } from "../../../_lib";

/** PUT /api/admin/users/[id]/role → PUT /v1/admin/users/:id/role (superuser only). */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return forwardAuthed({
    path: `/v1/admin/users/${encodeURIComponent(id)}/role`,
    request,
    method: "PUT",
    errorKey: "role_change_failed",
  });
}
