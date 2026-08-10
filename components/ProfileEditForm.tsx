"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/app/i18n/client";
import { getProfile, updateProfile } from "@/lib/api-client";
import type { ProfileResponse } from "@/lib/types";
// EDIT_MAX_LENGTHS mirrors the backend PUT profile caps, which are looser
// than registration. See lib/validation.ts.
import { EDIT_MAX_LENGTHS, isValidDate, isValidPhone } from "@/lib/validation";
import {
  sanitizeDateInput,
  sanitizePhoneInput,
  sanitizeTextInput,
  sanitizeTextInputForSubmission,
} from "@/lib/sanitize";
import { VALID_RANKS } from "@/lib/constants";

interface Props {
  lang: string;
}

// All editable fields, bundled — mirrors RegisterForm's formData pattern.
interface EditFormData {
  name: string;
  dateOfBirth: string;
  dojo: string;
  rank: string;
  lastGradingDate: string;
  medicalConditions: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  whatsapp: string;
  consentMarketing: boolean;
}

const EMPTY_FORM: EditFormData = {
  name: "",
  dateOfBirth: "",
  dojo: "",
  rank: "",
  lastGradingDate: "",
  medicalConditions: "",
  emergencyContactName: "",
  emergencyContactNumber: "",
  whatsapp: "",
  consentMarketing: false,
};

export default function ProfileEditForm({ lang }: Props) {
  const { t } = useTranslation(lang, "common");
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Editable fields
  const [formData, setFormData] = useState<EditFormData>(EMPTY_FORM);

  // Locked (read-only display)
  const [email, setEmail] = useState("");
  const [consentDatastore, setConsentDatastore] = useState(false);

  // UI state
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Mirror RegisterForm: sanitize per-field as the user types.
  const sanitizeField = (key: keyof EditFormData, value: string): string => {
    switch (key) {
      case "whatsapp":
      case "emergencyContactNumber":
        return sanitizePhoneInput(value);
      case "dateOfBirth":
      case "lastGradingDate":
        return sanitizeDateInput(value);
      default:
        return sanitizeTextInput(value);
    }
  };

  const setField = <K extends keyof EditFormData>(
    key: K,
    value: EditFormData[K],
  ) =>
    setFormData((prev) => ({
      ...prev,
      [key]: typeof value === "string" ? sanitizeField(key, value) : value,
    }));

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await getProfile();
      if (cancelled) return;

      if (result.ok) {
        const p = result.profile;
        setProfile(p);
        setFormData({
          name: p.name,
          dateOfBirth: p.date_of_birth,
          dojo: p.dojo,
          rank: p.rank,
          lastGradingDate: p.last_grading_date,
          medicalConditions: p.medical_conditions,
          emergencyContactName: p.emergency_contact_name,
          emergencyContactNumber: p.emergency_contact_number,
          whatsapp: p.whatsapp ?? "",
          consentMarketing: p.consent_marketing,
        });
        setEmail(p.email);
        setConsentDatastore(p.consent_datastore);
      } else if (result.status === 401) {
        router.replace(`/${lang}/login?expired=1`);
        return;
      } else {
        setLoadError(true);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [lang, router]);

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!profile) return errors;

    const {
      name,
      whatsapp,
      dateOfBirth,
      dojo,
      rank,
      lastGradingDate,
      medicalConditions,
      emergencyContactName,
      emergencyContactNumber,
    } = formData;

    // Backend ignores empty strings (partial update on `!= ""`), so clearing an
    // optional field that had a value would silently no-op. Block it up front
    // (plan decision (a): no "clear" affordance).
    const cannotClear = (orig: string | undefined | null, cur: string) =>
      (orig ?? "").trim() !== "" && cur.trim() === "";
    if (cannotClear(profile.whatsapp, whatsapp))
      errors.whatsapp = t("edit_profile_error_cannot_clear");
    if (cannotClear(profile.date_of_birth, dateOfBirth))
      errors.date_of_birth = t("edit_profile_error_cannot_clear");
    if (cannotClear(profile.dojo, dojo))
      errors.dojo = t("edit_profile_error_cannot_clear");
    if (cannotClear(profile.rank, rank))
      errors.rank = t("edit_profile_error_cannot_clear");
    if (cannotClear(profile.last_grading_date, lastGradingDate))
      errors.last_grading_date = t("edit_profile_error_cannot_clear");
    if (cannotClear(profile.medical_conditions, medicalConditions))
      errors.medical_conditions = t("edit_profile_error_cannot_clear");

    if (!name.trim()) errors.name = t("edit_profile_error_required");
    else if (name.trim().length > EDIT_MAX_LENGTHS.name)
      errors.name = t("edit_profile_error_too_long");

    if (whatsapp && !isValidPhone(whatsapp))
      errors.whatsapp = t("edit_profile_error_invalid_phone");

    if (!isValidDate(dateOfBirth))
      errors.date_of_birth = t("edit_profile_error_invalid_date");

    if (dojo.length > EDIT_MAX_LENGTHS.dojo)
      errors.dojo = t("edit_profile_error_too_long");

    if (rank && !VALID_RANKS.includes(rank))
      errors.rank = t("edit_profile_error_invalid_rank");

    if (!isValidDate(lastGradingDate))
      errors.last_grading_date = t("edit_profile_error_invalid_date");

    if (medicalConditions.length > EDIT_MAX_LENGTHS.medicalConditions)
      errors.medical_conditions = t("edit_profile_error_too_long");

    // Emergency contact fields are optional (registration allows empty) —
    // validate format/length only when provided.
    if (
      emergencyContactName.trim().length > EDIT_MAX_LENGTHS.emergencyContactName
    )
      errors.emergency_contact_name = t("edit_profile_error_too_long");

    if (emergencyContactNumber && !isValidPhone(emergencyContactNumber))
      errors.emergency_contact_number = t("edit_profile_error_invalid_phone");

    return errors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);

    // Build payload — always send consent_marketing (ptr-bool),
    // send whatsapp only if non-empty. Sanitize again at the trust boundary
    // (mirrors RegisterForm's buildSanitizedPayload).
    const payload: Record<string, unknown> = {
      name: sanitizeTextInputForSubmission(formData.name),
      whatsapp: sanitizePhoneInput(formData.whatsapp) || undefined,
      date_of_birth: sanitizeDateInput(formData.dateOfBirth),
      dojo: sanitizeTextInputForSubmission(formData.dojo),
      rank: sanitizeTextInputForSubmission(formData.rank),
      last_grading_date: sanitizeDateInput(formData.lastGradingDate),
      medical_conditions: sanitizeTextInputForSubmission(
        formData.medicalConditions,
      ),
      emergency_contact_name: sanitizeTextInputForSubmission(
        formData.emergencyContactName,
      ),
      emergency_contact_number: sanitizePhoneInput(
        formData.emergencyContactNumber,
      ),
      consent_marketing: formData.consentMarketing,
    };
    const result = await updateProfile(payload);
    setSaving(false);

    if (result.ok) {
      router.push(`/${lang}/profile?saved=1`);
      return;
    }

    if (result.error === "unauthorized") {
      router.replace(`/${lang}/login?expired=1`);
      return;
    }

    if (result.error === "validation") {
      // Backend returns a single {error} string, not per-field errors —
      // surface it verbatim so the member sees why the edit was rejected.
      setServerError(result.message || t("edit_profile_error_400"));
      return;
    }

    setServerError(t("edit_profile_error_500"));
  }

  function handleCancel() {
    router.push(`/${lang}/profile`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape" && !saving) handleCancel();
  }

  function fieldClass(hasError: boolean) {
    return `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 disabled:opacity-50 ${
      hasError
        ? "border-red-400 focus:ring-red-500"
        : "border-gray-300 focus:ring-blue-500"
    }`;
  }

  function lockedField() {
    return "w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed";
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-gray-500">{t("profile_loading")}</p>
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="p-4 bg-red-50 border border-red-300 text-red-700 rounded max-w-md text-center"
          role="alert"
          aria-live="polite"
        >
          {t("profile_load_failed")}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center p-4 md:p-24">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {t("edit_profile_heading")}
        </h1>

        {serverError && (
          <div
            className="mb-4 p-3 bg-red-50 border border-red-300 text-red-700 rounded text-sm"
            role="alert"
            aria-live="polite"
          >
            {serverError}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDown}
          noValidate
          className="space-y-4"
        >
          {/* ── Editable fields ── */}

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              {t("profile_name")}
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setField("name", e.target.value)}
              maxLength={EDIT_MAX_LENGTHS.name}
              disabled={saving}
              aria-invalid={!!fieldErrors.name}
              aria-describedby={fieldErrors.name ? "name-error" : undefined}
              className={fieldClass(!!fieldErrors.name)}
            />
            {fieldErrors.name && (
              <p
                id="name-error"
                className="mt-1 text-sm text-red-600"
                role="alert"
              >
                {fieldErrors.name}
              </p>
            )}
          </div>

          {/* WhatsApp */}
          <div>
            <label
              htmlFor="whatsapp"
              className="block text-sm font-medium mb-1"
            >
              {t("profile_whatsapp")}
            </label>
            <input
              id="whatsapp"
              type="tel"
              value={formData.whatsapp}
              onChange={(e) => setField("whatsapp", e.target.value)}
              maxLength={EDIT_MAX_LENGTHS.whatsapp}
              disabled={saving}
              aria-invalid={!!fieldErrors.whatsapp}
              aria-describedby={
                fieldErrors.whatsapp ? "whatsapp-error" : undefined
              }
              className={fieldClass(!!fieldErrors.whatsapp)}
            />
            {fieldErrors.whatsapp && (
              <p
                id="whatsapp-error"
                className="mt-1 text-sm text-red-600"
                role="alert"
              >
                {fieldErrors.whatsapp}
              </p>
            )}
          </div>

          {/* Date of Birth */}
          <div>
            <label
              htmlFor="date_of_birth"
              className="block text-sm font-medium mb-1"
            >
              {t("profile_date_of_birth")}
            </label>
            <input
              id="date_of_birth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setField("dateOfBirth", e.target.value)}
              disabled={saving}
              aria-invalid={!!fieldErrors.date_of_birth}
              aria-describedby={
                fieldErrors.date_of_birth ? "dob-error" : undefined
              }
              className={fieldClass(!!fieldErrors.date_of_birth)}
            />
            {fieldErrors.date_of_birth && (
              <p
                id="dob-error"
                className="mt-1 text-sm text-red-600"
                role="alert"
              >
                {fieldErrors.date_of_birth}
              </p>
            )}
          </div>

          {/* Dojo */}
          <div>
            <label htmlFor="dojo" className="block text-sm font-medium mb-1">
              {t("profile_dojo")}
            </label>
            <input
              id="dojo"
              type="text"
              value={formData.dojo}
              onChange={(e) => setField("dojo", e.target.value)}
              maxLength={EDIT_MAX_LENGTHS.dojo}
              disabled={saving}
              aria-invalid={!!fieldErrors.dojo}
              aria-describedby={fieldErrors.dojo ? "dojo-error" : undefined}
              className={fieldClass(!!fieldErrors.dojo)}
            />
            {fieldErrors.dojo && (
              <p
                id="dojo-error"
                className="mt-1 text-sm text-red-600"
                role="alert"
              >
                {fieldErrors.dojo}
              </p>
            )}
          </div>

          {/* Rank */}
          <div>
            <label htmlFor="rank" className="block text-sm font-medium mb-1">
              {t("profile_rank")}
            </label>
            <select
              id="rank"
              value={formData.rank}
              onChange={(e) => setField("rank", e.target.value)}
              disabled={saving}
              aria-invalid={!!fieldErrors.rank}
              aria-describedby={fieldErrors.rank ? "rank-error" : undefined}
              className={fieldClass(!!fieldErrors.rank)}
            >
              {!profile.rank && <option value="">{t("select_rank")}</option>}
              {VALID_RANKS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            {fieldErrors.rank && (
              <p
                id="rank-error"
                className="mt-1 text-sm text-red-600"
                role="alert"
              >
                {fieldErrors.rank}
              </p>
            )}
          </div>

          {/* Last Grading Date */}
          <div>
            <label
              htmlFor="last_grading_date"
              className="block text-sm font-medium mb-1"
            >
              {t("profile_last_grading_date")}
            </label>
            <input
              id="last_grading_date"
              type="date"
              value={formData.lastGradingDate}
              onChange={(e) => setField("lastGradingDate", e.target.value)}
              disabled={saving}
              aria-invalid={!!fieldErrors.last_grading_date}
              aria-describedby={
                fieldErrors.last_grading_date ? "grading-error" : undefined
              }
              className={fieldClass(!!fieldErrors.last_grading_date)}
            />
            {fieldErrors.last_grading_date && (
              <p
                id="grading-error"
                className="mt-1 text-sm text-red-600"
                role="alert"
              >
                {fieldErrors.last_grading_date}
              </p>
            )}
          </div>

          {/* Medical Conditions */}
          <div>
            <label
              htmlFor="medical_conditions"
              className="block text-sm font-medium mb-1"
            >
              {t("profile_medical_conditions")}
            </label>
            <textarea
              id="medical_conditions"
              value={formData.medicalConditions}
              onChange={(e) => setField("medicalConditions", e.target.value)}
              maxLength={EDIT_MAX_LENGTHS.medicalConditions}
              rows={3}
              disabled={saving}
              aria-invalid={!!fieldErrors.medical_conditions}
              aria-describedby={
                fieldErrors.medical_conditions ? "medical-error" : undefined
              }
              className={fieldClass(!!fieldErrors.medical_conditions)}
            />
            {fieldErrors.medical_conditions && (
              <p
                id="medical-error"
                className="mt-1 text-sm text-red-600"
                role="alert"
              >
                {fieldErrors.medical_conditions}
              </p>
            )}
          </div>

          {/* Emergency Contact Name */}
          <div>
            <label
              htmlFor="emergency_contact_name"
              className="block text-sm font-medium mb-1"
            >
              {t("profile_emergency_contact_name")}
            </label>
            <input
              id="emergency_contact_name"
              type="text"
              value={formData.emergencyContactName}
              onChange={(e) => setField("emergencyContactName", e.target.value)}
              maxLength={EDIT_MAX_LENGTHS.emergencyContactName}
              disabled={saving}
              aria-invalid={!!fieldErrors.emergency_contact_name}
              aria-describedby={
                fieldErrors.emergency_contact_name ? "ecname-error" : undefined
              }
              className={fieldClass(!!fieldErrors.emergency_contact_name)}
            />
            {fieldErrors.emergency_contact_name && (
              <p
                id="ecname-error"
                className="mt-1 text-sm text-red-600"
                role="alert"
              >
                {fieldErrors.emergency_contact_name}
              </p>
            )}
          </div>

          {/* Emergency Contact Number */}
          <div>
            <label
              htmlFor="emergency_contact_number"
              className="block text-sm font-medium mb-1"
            >
              {t("profile_emergency_contact_number")}
            </label>
            <input
              id="emergency_contact_number"
              type="text"
              value={formData.emergencyContactNumber}
              onChange={(e) =>
                setField("emergencyContactNumber", e.target.value)
              }
              maxLength={EDIT_MAX_LENGTHS.emergencyContactNumber}
              disabled={saving}
              aria-invalid={!!fieldErrors.emergency_contact_number}
              aria-describedby={
                fieldErrors.emergency_contact_number ? "ecnum-error" : undefined
              }
              className={fieldClass(!!fieldErrors.emergency_contact_number)}
            />
            {fieldErrors.emergency_contact_number && (
              <p
                id="ecnum-error"
                className="mt-1 text-sm text-red-600"
                role="alert"
              >
                {fieldErrors.emergency_contact_number}
              </p>
            )}
          </div>

          {/* ── Consent ── */}

          {/* Marketing Consent (editable) */}
          <fieldset className="border border-gray-200 rounded-md p-4">
            <legend className="text-sm font-medium px-1">
              {t("consent_and_agreements")}
            </legend>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.consentMarketing}
                onChange={(e) => setField("consentMarketing", e.target.checked)}
                disabled={saving}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">{t("consent_marketing_text")}</span>
            </label>
          </fieldset>

          {/* ── Locked (read-only) fields ── */}

          <div className="border-t border-gray-200 pt-4 space-y-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              {t("edit_profile_locked")}
            </p>

            {/* Email (locked) */}
            <div>
              <label
                htmlFor="email-locked"
                className="block text-sm font-medium mb-1 text-gray-600"
              >
                {t("profile_email")}
              </label>
              <input
                id="email-locked"
                type="text"
                value={email}
                disabled
                tabIndex={-1}
                aria-disabled="true"
                className={lockedField()}
              />
            </div>

            {/* Storage Consent (locked) */}
            <div>
              <p className="block text-sm font-medium mb-1 text-gray-600">
                {t("profile_consent_datastore")}
              </p>
              <p className="text-sm text-gray-600 px-3 py-2">
                {consentDatastore ? t("yes") : t("no")}
              </p>
            </div>
          </div>

          {/* ── Actions ── */}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 px-4 bg-blue-700 text-white rounded-md hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? t("edit_profile_saving") : t("edit_profile_save")}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="flex-1 py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50 transition-colors"
            >
              {t("edit_profile_cancel")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
