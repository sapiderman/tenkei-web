import { forwardAuthed } from "../_lib";

/** GET /api/admin/users → GET /v1/admin/users (page/size/q/pending forwarded). */
export async function GET(request: Request) {
  const { search } = new URL(request.url);
  return forwardAuthed({
    path: `/v1/admin/users${search}`,
    request,
    errorKey: "users_unavailable",
  });
}
