import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { resolveRole } from "@/lib/server-auth";
import { AdminRoleProvider } from "./AdminRoleContext";

// Portal pages serve the strict nonce CSP (see proxy.ts); a nonce requires
// dynamic rendering — static prerendering would cache a stale nonce.
export const dynamic = "force-dynamic";

/**
 * Single server-side gate for the entire /admin subtree: resolve the viewer's
 * role once and redirect non-admins away before any admin page renders. The
 * resolved role is shared to client views via context (UX only — the backend
 * re-authorizes every request).
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  const cookieStore = await cookies();
  const role = await resolveRole(cookieStore);

  if (role !== "admin" && role !== "superuser") {
    redirect(`/${lang}/login`);
  }

  return <AdminRoleProvider role={role}>{children}</AdminRoleProvider>;
}
