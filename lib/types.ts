/**
 * Response shape from `GET /v1/auth/profile`.
 *
 * Field names match the backend snake_case exactly.
 * `id` is a numeric database identifier (backend int64); date fields are
 * strings (YYYY-MM-DD or "").
 */
export interface ProfileResponse {
  id: number;
  name: string;
  email: string;
  whatsapp: string;
  dojo: string;
  faculty?: string;
  major?: string;
  rank: string;
  date_of_birth: string;
  join_date: string;
  last_grading_date: string;
  role: string;
  consent_datastore: boolean;
  consent_marketing: boolean;
  medical_conditions: string;
  emergency_contact_name: string;
  emergency_contact_number: string;
}

// ---------------------------------------------------------------------------
// Administration (roles & member management)
// ---------------------------------------------------------------------------

/** The four role values used across the admin surface. */
export type UserRole = "new" | "user" | "admin" | "superuser";

/**
 * Summary row from `GET /v1/admin/users`. No PII (no DOB, medical, emergency
 * contact) — summary fields only, per the roles PRD.
 */
export interface UserSummary {
  id: number;
  name: string;
  email: string;
  whatsapp: string;
  dojo: string;
  role: string; // UserRole
}

/**
 * Envelope for `GET /v1/admin/users` (matches backend ListUsersResponse).
 * `total` is the matching-row count across all pages; `page` is 1-based and
 * `size` is the applied (backend-clamped) page size.
 */
export interface UserListResponse {
  members: UserSummary[];
  total: number;
  page: number;
  size: number;
}
