"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/app/i18n/client";
import { useAdminRole } from "@/app/[lang]/admin/AdminRoleContext";
import {
  adminGetUser,
  adminUpdateUser,
  adminVerifyUser,
  adminChangeRole,
  type AdminMutationResult,
} from "@/lib/api-client";
import { VALID_RANKS } from "@/lib/constants";
import {
  isValidDate,
  isValidEmail,
  isValidPhone,
  MAX_LENGTHS,
} from "@/lib/validation";
import type { ProfileResponse } from "@/lib/types";

/** The editable field whitelist — matches backend UpdateProfileRequest
 * (name, email, whatsapp, date_of_birth, dojo, rank, last_grading_date,
 *  medical_conditions, emergency_contact_name, emergency_contact_number,
 *  consent_datastore, consent_marketing). role/id/join_date are read-only. */

const ROLES = ["new", "user", "admin", "superuser"] as const;

type FormState = Record<string, string | boolean>;

function toForm(p: ProfileResponse): FormState {
  return {
    name: p.name,
    email: p.email,
    whatsapp: p.whatsapp,
    date_of_birth: p.date_of_birth,
    dojo: p.dojo,
    rank: p.rank,
    last_grading_date: p.last_grading_date,
    medical_conditions: p.medical_conditions,
    emergency_contact_name: p.emergency_contact_name,
    emergency_contact_number: p.emergency_contact_number,
    consent_datastore: p.consent_datastore,
    consent_marketing: p.consent_marketing,
  };
}

export default function AdminUserDetailView({
  lang,
  id,
}: {
  lang: string;
  id: string;
}) {
  const { t } = useTranslation(lang, "common");
  const router = useRouter();
  const viewerRole = useAdminRole();

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [form, setForm] = useState<FormState>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifySuccess, setVerifySuccess] = useState(false);

  const [newRole, setNewRole] = useState("");
  const [changingRole, setChangingRole] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [roleSuccess, setRoleSuccess] = useState(false);

  const isAdminLike = viewerRole === "admin" || viewerRole === "superuser";
  const isSuperuser = viewerRole === "superuser";

  const refresh = useCallback(async (): Promise<boolean> => {
    const result = await adminGetUser(id);
    if (result.ok) {
      setProfile(result.profile);
      setForm(toForm(result.profile));
      setNewRole(result.profile.role);
      return true;
    }
    if (result.status === 401) {
      router.replace(`/${lang}/login?expired=1`);
    }
    return false;
  }, [id, lang, router]);

  // Initial load.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await adminGetUser(id);
      if (cancelled) return;
      if (result.ok) {
        setProfile(result.profile);
        setForm(toForm(result.profile));
        setNewRole(result.profile.role);
      } else if (result.status === 401) {
        router.replace(`/${lang}/login?expired=1`);
        return;
      } else if (result.status === 404) {
        setNotFound(true);
      } else {
        setLoadError(true);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, lang, router]);

  function update(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  /** Client-side UX validation — reuses the shared lib/validation.ts (the same
   * single source of truth as RegisterForm). The backend remains the authority
   * and re-validates; this just fails fast before the round-trip. */
  function validateForm(): string | null {
    const name = String(form.name ?? "").trim();
    const email = String(form.email ?? "");
    const whatsapp = String(form.whatsapp ?? "");
    const dob = String(form.date_of_birth ?? "");
    const dojo = String(form.dojo ?? "");
    const lgd = String(form.last_grading_date ?? "");
    const ecName = String(form.emergency_contact_name ?? "");
    const ecNum = String(form.emergency_contact_number ?? "");
    const medical = String(form.medical_conditions ?? "");

    if (!name) return "Full name is required";
    if (name.length > MAX_LENGTHS.name)
      return `Name is too long (max ${MAX_LENGTHS.name} characters)`;
    if (email.length > MAX_LENGTHS.email)
      return `Email is too long (max ${MAX_LENGTHS.email} characters)`;
    if (email && !isValidEmail(email))
      return "Please enter a valid email address";
    if (whatsapp.length > MAX_LENGTHS.whatsapp)
      return `WhatsApp number is too long (max ${MAX_LENGTHS.whatsapp} characters)`;
    if (whatsapp && !isValidPhone(whatsapp))
      return "Please enter a valid WhatsApp number";
    if (dob && !isValidDate(dob))
      return "Date of birth cannot be in the future";
    if (dojo.length > MAX_LENGTHS.dojo)
      return `Dojo name is too long (max ${MAX_LENGTHS.dojo} characters)`;
    if (lgd && !isValidDate(lgd))
      return "Please enter a valid last grading date";
    if (ecName.length > MAX_LENGTHS.emergencyContactName)
      return `Emergency contact name is too long (max ${MAX_LENGTHS.emergencyContactName} characters)`;
    if (ecNum.length > MAX_LENGTHS.emergencyContactNumber)
      return `Emergency contact number is too long (max ${MAX_LENGTHS.emergencyContactNumber} characters)`;
    if (ecNum && !isValidPhone(ecNum))
      return "Please enter a valid emergency contact number";
    if (medical.length > MAX_LENGTHS.medicalConditions)
      return `Medical conditions text is too long (max ${MAX_LENGTHS.medicalConditions} characters)`;
    return null;
  }

  function messageFor(
    result: Extract<AdminMutationResult, { ok: false }>,
    fallbackKey: string,
  ): string {
    return result.error.trim() ? result.error : t(fallbackKey);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setSaveError(validationError);
      setSaved(false);
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSaved(false);

    const result = await adminUpdateUser(id, form);
    if (result.ok) {
      // PUT returns only {status:"ok"}; refetch the authoritative profile.
      const ok = await refresh();
      if (ok) setSaved(true);
    } else if (result.status === 401) {
      router.replace(`/${lang}/login?expired=1`);
      return;
    } else {
      setSaveError(messageFor(result, "admin_save_failed"));
    }
    setSaving(false);
  }

  async function handleVerify() {
    setVerifying(true);
    setVerifyError(null);
    setVerifySuccess(false);

    const result = await adminVerifyUser(id);
    if (result.ok) {
      const ok = await refresh();
      if (ok) setVerifySuccess(true);
    } else if (result.status === 401) {
      router.replace(`/${lang}/login?expired=1`);
      return;
    } else {
      // 409 (already verified) / 404 (out of scope) surface the backend message.
      setVerifyError(messageFor(result, "admin_verify_failed"));
    }
    setVerifying(false);
  }

  async function handleRoleChange(e: React.FormEvent) {
    e.preventDefault();
    if (!newRole) return;
    setChangingRole(true);
    setRoleError(null);
    setRoleSuccess(false);

    const result = await adminChangeRole(id, newRole);
    if (result.ok) {
      const ok = await refresh();
      if (ok) setRoleSuccess(true);
    } else if (result.status === 401) {
      router.replace(`/${lang}/login?expired=1`);
      return;
    } else {
      // 409 (last superuser) / 400 (invalid role) surface the backend message.
      setRoleError(messageFor(result, "admin_role_change_failed"));
    }
    setChangingRole(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-gray-500">{t("admin_loading")}</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 gap-4">
        <div
          className="p-4 bg-yellow-50 border border-yellow-300 text-yellow-800 rounded max-w-md text-center"
          role="status"
        >
          {t("admin_user_not_found")}
        </div>
        <Link
          href={`/${lang}/admin/users`}
          className="text-blue-600 hover:underline"
        >
          {t("admin_back_to_list")}
        </Link>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 gap-4">
        <div
          className="p-4 bg-red-50 border border-red-300 text-red-700 rounded max-w-md text-center"
          role="alert"
        >
          {t("admin_user_load_failed")}
        </div>
        <Link
          href={`/${lang}/admin/users`}
          className="text-blue-600 hover:underline"
        >
          {t("admin_back_to_list")}
        </Link>
      </div>
    );
  }

  if (!profile) return null;

  const inputCls =
    "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="flex min-h-screen flex-col items-center p-4 md:p-12">
      <div className="w-full max-w-2xl">
        <div className="mb-6">
          <Link
            href={`/${lang}/admin/users`}
            className="text-sm text-blue-600 hover:underline"
          >
            ← {t("admin_back_to_list")}
          </Link>
          <h1 className="text-2xl font-bold mt-2">{t("admin_user_heading")}</h1>
        </div>

        {/* Read-only identity */}
        <dl className="grid grid-cols-2 gap-3 mb-6 text-sm">
          <div>
            <dt className="text-gray-500">{t("no_short")}</dt>
            <dd className="text-gray-900">{profile.id}</dd>
          </div>
          <div>
            <dt className="text-gray-500">{t("admin_join_date")}</dt>
            <dd className="text-gray-900">{profile.join_date || "—"}</dd>
          </div>
          <div>
            <dt className="text-gray-500">{t("profile_role")}</dt>
            <dd className="text-gray-900">{t(`admin_role_${profile.role}`)}</dd>
          </div>
        </dl>

        {/* Verify action (admin+). Button shows only while target is pending;
            status messages persist after the refresh flips role away from new. */}
        {isAdminLike &&
          (profile.role === "new" ||
            verifying ||
            verifySuccess ||
            verifyError) && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300 rounded">
              {profile.role === "new" && (
                <p className="text-sm text-yellow-800 mb-3">
                  {t("admin_verify_hint")}
                </p>
              )}
              {profile.role === "new" && (
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={verifying}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {verifying ? t("admin_verifying") : t("admin_verify")}
                </button>
              )}
              {verifySuccess && (
                <p className="mt-2 text-sm text-green-700">
                  {t("admin_verify_success")}
                </p>
              )}
              {verifyError && (
                <p className="mt-2 text-sm text-red-700" role="alert">
                  {verifyError}
                </p>
              )}
            </div>
          )}

        {/* Role change (superuser only). */}
        {isSuperuser && (
          <form
            onSubmit={handleRoleChange}
            className="mb-6 p-4 border border-gray-200 rounded"
          >
            <label className={labelCls} htmlFor="role-select">
              {t("admin_change_role")}
            </label>
            <div className="flex gap-2">
              <select
                id="role-select"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className={inputCls}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {t(`admin_role_${r}`)}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={changingRole || newRole === profile.role}
                className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {changingRole ? t("admin_saving") : t("admin_apply")}
              </button>
            </div>
            {roleSuccess && (
              <p className="mt-2 text-sm text-green-700">
                {t("admin_role_change_success")}
              </p>
            )}
            {roleError && (
              <p className="mt-2 text-sm text-red-700" role="alert">
                {roleError}
              </p>
            )}
          </form>
        )}

        {/* Profile edit form (role structurally absent). */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className={labelCls} htmlFor="f-name">
              {t("full_name")}
            </label>
            <input
              id="f-name"
              type="text"
              value={(form.name as string) || ""}
              onChange={(e) => update("name", e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="f-email">
              {t("email_address")}
            </label>
            <input
              id="f-email"
              type="email"
              value={(form.email as string) || ""}
              onChange={(e) => update("email", e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="f-whatsapp">
              {t("whatsapp_number")}
            </label>
            <input
              id="f-whatsapp"
              type="tel"
              value={(form.whatsapp as string) || ""}
              onChange={(e) => update("whatsapp", e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="f-dob">
              {t("date_of_birth")}
            </label>
            <input
              id="f-dob"
              type="date"
              value={(form.date_of_birth as string) || ""}
              onChange={(e) => update("date_of_birth", e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="f-dojo">
              {t("dojo")}
            </label>
            <input
              id="f-dojo"
              type="text"
              value={(form.dojo as string) || ""}
              onChange={(e) => update("dojo", e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="f-rank">
              {t("current_rank")}
            </label>
            <select
              id="f-rank"
              value={(form.rank as string) || ""}
              onChange={(e) => update("rank", e.target.value)}
              className={inputCls}
            >
              <option value="">{t("select_rank")}</option>
              {VALID_RANKS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls} htmlFor="f-lgd">
              {t("last_grading_date")}
            </label>
            <input
              id="f-lgd"
              type="date"
              value={(form.last_grading_date as string) || ""}
              onChange={(e) => update("last_grading_date", e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="f-ecn">
              {t("emergency_contact_name")}
            </label>
            <input
              id="f-ecn"
              type="text"
              value={(form.emergency_contact_name as string) || ""}
              onChange={(e) => update("emergency_contact_name", e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="f-ecnum">
              {t("emergency_contact_number")}
            </label>
            <input
              id="f-ecnum"
              type="tel"
              value={(form.emergency_contact_number as string) || ""}
              onChange={(e) =>
                update("emergency_contact_number", e.target.value)
              }
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="f-med">
              {t("medical_conditions")}
            </label>
            <textarea
              id="f-med"
              rows={3}
              value={(form.medical_conditions as string) || ""}
              onChange={(e) => update("medical_conditions", e.target.value)}
              className={inputCls}
              placeholder={t("medical_conditions_placeholder")}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={Boolean(form.consent_datastore)}
                onChange={(e) => update("consent_datastore", e.target.checked)}
                className="mt-1 h-4 w-4"
              />
              <span>{t("consent_datastore_text")}</span>
            </label>
            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={Boolean(form.consent_marketing)}
                onChange={(e) => update("consent_marketing", e.target.checked)}
                className="mt-1 h-4 w-4"
              />
              <span>{t("consent_marketing_text")}</span>
            </label>
          </div>

          {saveError && (
            <p className="text-sm text-red-700" role="alert">
              {saveError}
            </p>
          )}
          {saved && !saveError && (
            <p className="text-sm text-green-700">{t("admin_save_success")}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? t("admin_saving") : t("admin_save")}
          </button>
        </form>
      </div>
    </div>
  );
}
