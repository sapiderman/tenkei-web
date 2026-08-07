"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/app/i18n/client";
import { getProfile, updateProfile } from "@/lib/api-client";
import type { ProfileResponse } from "@/lib/types";
import { MAX_LENGTHS, isValidDate, isValidPhone } from "@/lib/validation";
import { VALID_RANKS } from "@/lib/constants";

interface Props {
  lang: string;
}

export default function ProfileEditForm({ lang }: Props) {
  const { t } = useTranslation(lang, "common");
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Editable fields
  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [dojo, setDojo] = useState("");
  const [rank, setRank] = useState("");
  const [lastGradingDate, setLastGradingDate] = useState("");
  const [medicalConditions, setMedicalConditions] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactNumber, setEmergencyContactNumber] = useState("");
  const [consentMarketing, setConsentMarketing] = useState(false);

  // Locked (read-only display)
  const [email, setEmail] = useState("");
  const [consentDatastore, setConsentDatastore] = useState(false);

  // UI state
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await getProfile();
      if (cancelled) return;

      if (result.ok) {
        const p = result.profile;
        setProfile(p);
        setName(p.name);
        setDateOfBirth(p.date_of_birth);
        setDojo(p.dojo);
        setRank(p.rank);
        setLastGradingDate(p.last_grading_date);
        setMedicalConditions(p.medical_conditions);
        setEmergencyContactName(p.emergency_contact_name);
        setEmergencyContactNumber(p.emergency_contact_number);
        setConsentMarketing(p.consent_marketing);
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

    if (!name.trim()) errors.name = t("edit_profile_error_required");
    else if (name.trim().length > MAX_LENGTHS.name)
      errors.name = t("edit_profile_error_too_long");

    if (!isValidDate(dateOfBirth))
      errors.date_of_birth = t("edit_profile_error_invalid_date");

    if (dojo.length > MAX_LENGTHS.dojo)
      errors.dojo = t("edit_profile_error_too_long");

    if (rank && !VALID_RANKS.includes(rank))
      errors.rank = t("edit_profile_error_invalid_rank");

    if (!isValidDate(lastGradingDate))
      errors.last_grading_date = t("edit_profile_error_invalid_date");

    if (medicalConditions.length > MAX_LENGTHS.medicalConditions)
      errors.medical_conditions = t("edit_profile_error_too_long");

    if (!emergencyContactName.trim())
      errors.emergency_contact_name = t("edit_profile_error_required");
    else if (emergencyContactName.trim().length > MAX_LENGTHS.emergencyContactName)
      errors.emergency_contact_name = t("edit_profile_error_too_long");

    if (!emergencyContactNumber.trim())
      errors.emergency_contact_number = t("edit_profile_error_required");
    else if (!isValidPhone(emergencyContactNumber))
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
    // send whatsapp only if non-empty.
    const payload: Record<string, unknown> = {
      name: name.trim(),
      whatsapp: "", // TODO Phase 4: restore when backend drops WhatsApp unique index
      date_of_birth: dateOfBirth,
      dojo: dojo.trim(),
      rank,
      last_grading_date: lastGradingDate,
      medical_conditions: medicalConditions.trim(),
      emergency_contact_name: emergencyContactName.trim(),
      emergency_contact_number: emergencyContactNumber.trim(),
      consent_marketing: consentMarketing,
    };
    const result = await updateProfile(payload);
    setSaving(false);

    if (result.ok) {
      router.push(`/${lang}/profile`);
      return;
    }

    if (result.error === "unauthorized") {
      router.replace(`/${lang}/login?expired=1`);
      return;
    }

    if (result.error === "validation") {
      setFieldErrors(result.fields);
      setServerError(t("edit_profile_error_400"));
      return;
    }

    setServerError(t("edit_profile_error_500"));
  }

  function handleCancel() {
    router.push(`/${lang}/profile`);
  }

  function fieldClass(hasError: boolean) {
    return `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 disabled:opacity-50 ${
      hasError
        ? "border-red-400 focus:ring-red-500"
        : "border-gray-300 focus:ring-blue-500"
    }`;
  }

  function lockedField() {
    return "w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed";
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
          {t("edit_profile_page_title").split("|")[0].trim()}
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

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* ── Editable fields ── */}

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              {t("profile_name")}
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={MAX_LENGTHS.name}
              disabled={saving}
              aria-invalid={!!fieldErrors.name}
              aria-describedby={fieldErrors.name ? "name-error" : undefined}
              className={fieldClass(!!fieldErrors.name)}
            />
            {fieldErrors.name && (
              <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
                {fieldErrors.name}
              </p>
            )}
          </div>

          {/* Date of Birth */}
          <div>
            <label htmlFor="date_of_birth" className="block text-sm font-medium mb-1">
              {t("profile_date_of_birth")}
            </label>
            <input
              id="date_of_birth"
              type="text"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              placeholder="YYYY-MM-DD"
              disabled={saving}
              aria-invalid={!!fieldErrors.date_of_birth}
              aria-describedby={fieldErrors.date_of_birth ? "dob-error" : undefined}
              className={fieldClass(!!fieldErrors.date_of_birth)}
            />
            {fieldErrors.date_of_birth && (
              <p id="dob-error" className="mt-1 text-sm text-red-600" role="alert">
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
              value={dojo}
              onChange={(e) => setDojo(e.target.value)}
              maxLength={MAX_LENGTHS.dojo}
              disabled={saving}
              aria-invalid={!!fieldErrors.dojo}
              aria-describedby={fieldErrors.dojo ? "dojo-error" : undefined}
              className={fieldClass(!!fieldErrors.dojo)}
            />
            {fieldErrors.dojo && (
              <p id="dojo-error" className="mt-1 text-sm text-red-600" role="alert">
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
              value={rank}
              onChange={(e) => setRank(e.target.value)}
              disabled={saving}
              aria-invalid={!!fieldErrors.rank}
              aria-describedby={fieldErrors.rank ? "rank-error" : undefined}
              className={fieldClass(!!fieldErrors.rank)}
            >
              <option value="">{t("select_rank")}</option>
              {VALID_RANKS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            {fieldErrors.rank && (
              <p id="rank-error" className="mt-1 text-sm text-red-600" role="alert">
                {fieldErrors.rank}
              </p>
            )}
          </div>

          {/* Last Grading Date */}
          <div>
            <label htmlFor="last_grading_date" className="block text-sm font-medium mb-1">
              {t("profile_last_grading_date")}
            </label>
            <input
              id="last_grading_date"
              type="text"
              value={lastGradingDate}
              onChange={(e) => setLastGradingDate(e.target.value)}
              placeholder="YYYY-MM-DD"
              disabled={saving}
              aria-invalid={!!fieldErrors.last_grading_date}
              aria-describedby={fieldErrors.last_grading_date ? "grading-error" : undefined}
              className={fieldClass(!!fieldErrors.last_grading_date)}
            />
            {fieldErrors.last_grading_date && (
              <p id="grading-error" className="mt-1 text-sm text-red-600" role="alert">
                {fieldErrors.last_grading_date}
              </p>
            )}
          </div>

          {/* Medical Conditions */}
          <div>
            <label htmlFor="medical_conditions" className="block text-sm font-medium mb-1">
              {t("profile_medical_conditions")}
            </label>
            <textarea
              id="medical_conditions"
              value={medicalConditions}
              onChange={(e) => setMedicalConditions(e.target.value)}
              maxLength={MAX_LENGTHS.medicalConditions}
              rows={3}
              disabled={saving}
              aria-invalid={!!fieldErrors.medical_conditions}
              aria-describedby={fieldErrors.medical_conditions ? "medical-error" : undefined}
              className={fieldClass(!!fieldErrors.medical_conditions)}
            />
            {fieldErrors.medical_conditions && (
              <p id="medical-error" className="mt-1 text-sm text-red-600" role="alert">
                {fieldErrors.medical_conditions}
              </p>
            )}
          </div>

          {/* Emergency Contact Name */}
          <div>
            <label htmlFor="emergency_contact_name" className="block text-sm font-medium mb-1">
              {t("profile_emergency_contact_name")}
            </label>
            <input
              id="emergency_contact_name"
              type="text"
              value={emergencyContactName}
              onChange={(e) => setEmergencyContactName(e.target.value)}
              maxLength={MAX_LENGTHS.emergencyContactName}
              disabled={saving}
              aria-invalid={!!fieldErrors.emergency_contact_name}
              aria-describedby={fieldErrors.emergency_contact_name ? "ecname-error" : undefined}
              className={fieldClass(!!fieldErrors.emergency_contact_name)}
            />
            {fieldErrors.emergency_contact_name && (
              <p id="ecname-error" className="mt-1 text-sm text-red-600" role="alert">
                {fieldErrors.emergency_contact_name}
              </p>
            )}
          </div>

          {/* Emergency Contact Number */}
          <div>
            <label htmlFor="emergency_contact_number" className="block text-sm font-medium mb-1">
              {t("profile_emergency_contact_number")}
            </label>
            <input
              id="emergency_contact_number"
              type="text"
              value={emergencyContactNumber}
              onChange={(e) => setEmergencyContactNumber(e.target.value)}
              maxLength={MAX_LENGTHS.emergencyContactNumber}
              disabled={saving}
              aria-invalid={!!fieldErrors.emergency_contact_number}
              aria-describedby={fieldErrors.emergency_contact_number ? "ecnum-error" : undefined}
              className={fieldClass(!!fieldErrors.emergency_contact_number)}
            />
            {fieldErrors.emergency_contact_number && (
              <p id="ecnum-error" className="mt-1 text-sm text-red-600" role="alert">
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
                checked={consentMarketing}
                onChange={(e) => setConsentMarketing(e.target.checked)}
                disabled={saving}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">{t("consent_marketing_text")}</span>
            </label>
          </fieldset>

          {/* ── Locked (read-only) fields ── */}

          <div className="border-t border-gray-200 pt-4 space-y-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide">
              {t("edit_profile_locked")}
            </p>

            {/* Email (locked) */}
            <div>
              <label htmlFor="email-locked" className="block text-sm font-medium mb-1 text-gray-500">
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
              <label className="block text-sm font-medium mb-1 text-gray-500">
                {t("profile_consent_datastore")}
              </label>
              <p className="text-sm text-gray-500 px-3 py-2">
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
