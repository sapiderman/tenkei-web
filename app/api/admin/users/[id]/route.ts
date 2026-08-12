import { forwardAuthed } from "../../_lib";

/** GET /api/admin/users/[id] → GET /v1/admin/users/:id (full profile). */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return forwardAuthed({
    path: `/v1/admin/users/${encodeURIComponent(id)}`,
    request,
    errorKey: "user_unavailable",
  });
}

/** PUT /api/admin/users/[id] → PUT /v1/admin/users/:id (profile field whitelist). */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return forwardAuthed({
    path: `/v1/admin/users/${encodeURIComponent(id)}`,
    request,
    method: "PUT",
    errorKey: "user_update_failed",
  });
}
