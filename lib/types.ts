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
  category: string;
  university?: string;
  school_name?: string;
  guardian_name?: string;
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
  /** True once the member armed TOTP 2FA. Optional until the backend PR
   * ships the field; absent is treated as not-enabled (see TwoFactorSettings). */
  totp_enabled?: boolean;
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
  category: string; // UserCategory
  role: string; // UserRole
}

/**
 * Envelope for `GET /v1/admin/users` (matches backend ListUsersResponse).
 * `total` is the matching-row count across all pages; `page` is 1-based and
 * `size` is the applied (backend-clamped) page size.
 */
// ---------------------------------------------------------------------------
// Attendance (prd/attendance.prd) — mirrors the backend's JSON keys.
// ---------------------------------------------------------------------------

export type AttendanceStatus = "pending" | "confirmed" | "rejected";

/** Tailwind chip colors per status, shared by the member and admin views. */
export const ATTENDANCE_STATUS_CHIP: Record<AttendanceStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

/** One attendance row as its member sees it: never carries coordinates. */
export interface AttendanceRecord {
  id: number;
  user_id: number;
  user_name: string;
  logged_at: string;
  dojo: string;
  instructor: string;
  has_location: boolean;
  location_accuracy_m: number | null;
  status: AttendanceStatus;
  confirmed_by_name: string | null;
  confirmed_at: string | null;
}

/** The admin's view of the same row, with the coordinates the phone sent. */
export interface AdminAttendanceRecord extends AttendanceRecord {
  latitude: number | null;
  longitude: number | null;
}

export interface AttendanceLogResponse {
  id: number;
  logged_at: string;
  dojo: string;
  instructor: string;
  status: AttendanceStatus;
  has_location: boolean;
}

export interface AttendanceListResponse {
  items: AttendanceRecord[];
  total: number;
  page: number;
  size: number;
}

/** dojo -> instructor names, from the instructors table; dojos without rows are absent */
export type InstructorMap = Record<string, string[]>;

/** GET /api/attendance/instructors — all = instructors with dojo '' (teach everywhere). */
export interface InstructorListResponse {
  all: string[];
  instructors: InstructorMap;
}

export interface AdminAttendanceListResponse {
  items: AdminAttendanceRecord[];
  total: number;
  page: number;
  size: number;
}

export interface UserListResponse {
  members: UserSummary[];
  total: number;
  page: number;
  size: number;
}
