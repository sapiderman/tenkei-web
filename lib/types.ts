/**
 * Response shape from `GET /v1/auth/profile`.
 *
 * Field names match the backend snake_case exactly.
 * `id` is assumed to be a string UUID; date fields are strings (YYYY-MM-DD or "").
 * TODO: confirm against the tenkei-register backend struct before merge.
 */
export interface ProfileResponse {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  dojo: string;
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
