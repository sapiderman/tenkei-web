"use client";

import { useState, useRef, useEffect, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslation } from "@/app/i18n/client";
import { Turnstile } from "@marsidev/react-turnstile";
import { filterXSS } from "xss";
import { VALID_RANKS as RANK_OPTIONS } from "@/lib/constants";

interface RegisterFormData {
  name: string;
  email: string;
  whatsapp: string;
  date_of_birth: string;
  password: string;
  password_confirm: string;
  dojo: string;
  rank: string;
  last_grading_date: string;
  emergency_contact_name: string;
  emergency_contact_number: string;
  medical_conditions: string;
  consent_datastore: boolean;
  consent_marketing: boolean;
}

const DOJO_OPTIONS = [
  "Tenkei University Indonesia",
  "Tenkei Mayapada",
  "Tenkei Taman Menteng",
  "Tenkei Natsu Aikidojo",
];

const XSS_OPTIONS = {
  whiteList: {},
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style"],
};

const stripControlChars = (value: string) =>
  value
    .replace(/\r?\n/g, " ")
    .replace(/\t/g, " ")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]+/g, "");

const sanitizeTextInput = (value: string) =>
  stripControlChars(filterXSS(value, XSS_OPTIONS));

const sanitizeTextInputForSubmission = (value: string) =>
  stripControlChars(filterXSS(value.trim(), XSS_OPTIONS));

const sanitizePhoneInput = (value: string) =>
  stripControlChars(value.replace(/[^\d+\s().-]/g, "").trim());

const sanitizeDateInput = (value: string) =>
  stripControlChars(value.replace(/[^0-9-]/g, "").trim());

const sanitizePasswordInput = (value: string) => stripControlChars(value);

const sanitizeToken = (value: string) => stripControlChars(value.trim());

const buildSanitizedPayload = (data: RegisterFormData) => ({
  name: sanitizeTextInputForSubmission(data.name),
  email: sanitizeTextInputForSubmission(data.email),
  whatsapp: sanitizePhoneInput(data.whatsapp),
  date_of_birth: sanitizeDateInput(data.date_of_birth),
  password: sanitizePasswordInput(data.password),
  password_confirm: sanitizePasswordInput(data.password_confirm),
  dojo: sanitizeTextInputForSubmission(data.dojo),
  rank: sanitizeTextInputForSubmission(data.rank),
  last_grading_date: sanitizeDateInput(data.last_grading_date),
  emergency_contact_name: sanitizeTextInputForSubmission(
    data.emergency_contact_name,
  ),
  emergency_contact_number: sanitizePhoneInput(data.emergency_contact_number),
  medical_conditions: sanitizeTextInputForSubmission(data.medical_conditions),
  consent_datastore: data.consent_datastore,
  consent_marketing: data.consent_marketing,
});

export default function RegisterForm() {
  const params = useParams();
  const lang = params.lang as string;
  const { t } = useTranslation(lang, "common");

  const [formData, setFormData] = useState<RegisterFormData>({
    name: "",
    email: "",
    whatsapp: "",
    date_of_birth: "",
    password: "",
    password_confirm: "",
    dojo: "",
    rank: "",
    last_grading_date: "",
    emergency_contact_name: "",
    emergency_contact_number: "",
    medical_conditions: "",
    consent_datastore: false,
    consent_marketing: false,
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [dojoOpen, setDojoOpen] = useState(false);
  const [dojoSearch, setDojoSearch] = useState("");
  const dojoRef = useRef<HTMLDivElement>(null);

  const filteredDojos = DOJO_OPTIONS.filter((dojo) =>
    dojo.toLowerCase().includes(dojoSearch.toLowerCase()),
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dojoRef.current && !dojoRef.current.contains(event.target as Node)) {
        setDojoOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, type, value } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev: RegisterFormData) => ({ ...prev, [name]: checked }));
      return;
    }

    let sanitizedValue = value;

    switch (name) {
      case "password":
      case "password_confirm":
        sanitizedValue = sanitizePasswordInput(value);
        break;
      case "whatsapp":
      case "emergency_contact_number":
        sanitizedValue = sanitizePhoneInput(value);
        break;
      case "date_of_birth":
      case "last_grading_date":
        sanitizedValue = sanitizeDateInput(value);
        break;
      case "rank":
        sanitizedValue = sanitizeTextInput(value);
        break;
      default:
        sanitizedValue = sanitizeTextInput(value);
    }

    setFormData((prev: RegisterFormData) => ({
      ...prev,
      [name]: sanitizedValue,
    }));

    if (name === "dojo") {
      setDojoSearch(sanitizedValue);
    }
  };

  const handleDojoSelect = (dojo: string) => {
    const sanitizedDojo = sanitizeTextInput(dojo);
    setFormData((prev: RegisterFormData) => ({ ...prev, dojo: sanitizedDojo }));
    setDojoSearch(sanitizedDojo);
    setDojoOpen(false);
  };

  const handleTurnstileSuccess = (token: string) => {
    setTurnstileToken(sanitizeToken(token));
  };

  const validateForm = (): boolean => {
    // Security: Basic length checks to prevent massive payloads
    if (formData.name.length > 100) {
      setError("Name is too long (max 100 characters)");
      return false;
    }
    if (formData.email.length > 100) {
      setError("Email is too long (max 100 characters)");
      return false;
    }
    if (formData.whatsapp.length > 20) {
      setError("WhatsApp number is too long");
      return false;
    }
    if (formData.password.length > 128) {
      setError("Password is too long (max 128 characters)");
      return false;
    }
    if (formData.emergency_contact_name.length > 100) {
      setError("Emergency contact name is too long (max 100 characters)");
      return false;
    }
    if (formData.emergency_contact_number.length > 20) {
      setError("Emergency contact number is too long");
      return false;
    }
    if (formData.medical_conditions.length > 500) {
      setError("Medical conditions text is too long (max 500 characters)");
      return false;
    }

    // Check for potentially malicious content in text fields
    const textFields = [
      formData.name,
      formData.email,
      formData.emergency_contact_name,
      formData.medical_conditions,
      formData.dojo,
      formData.rank,
    ];
    for (const field of textFields) {
      if (field && field !== sanitizeTextInput(field)) {
        setError(
          "Invalid characters detected. Please remove special characters.",
        );
        return false;
      }
    }

    if (!formData.name.trim()) {
      setError("Full name is required");
      return false;
    }

    // Email validation (if provided)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }

    // International phone format: 7-15 digits, optionally starting with +
    const cleanedPhone = formData.whatsapp.replace(/[\s\-().]/g, "");
    const phoneRegex = /^\+?\d{7,15}$/;
    if (!formData.whatsapp.trim() || !phoneRegex.test(cleanedPhone)) {
      setError("Please enter a valid phone number");
      return false;
    }

    // Date of Birth validation (if provided)
    if (formData.date_of_birth) {
      const [y, m, d] = formData.date_of_birth.split("-").map(Number);
      const dob = new Date(y, m - 1, d);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (isNaN(dob.getTime()) || dob > today) {
        setError("Date of birth cannot be in the future");
        return false;
      }
    }

    // Emergency Contact Number validation (if provided)
    if (formData.emergency_contact_number) {
      const cleanedEmergency = formData.emergency_contact_number.replace(
        /[\s\-().]/g,
        "",
      );
      if (!phoneRegex.test(cleanedEmergency)) {
        setError("Please enter a valid Emergency Contact number");
        return false;
      }
    }

    // Validate dojo length
    if (formData.dojo.length > 100) {
      setError("Dojo name is too long (max 100 characters)");
      return false;
    }

    // Validate rank selection (must be from predefined list)
    if (formData.rank && !RANK_OPTIONS.includes(formData.rank)) {
      setError("Please select a valid rank from the list");
      return false;
    }

    if (!formData.password) {
      setError("Password is required");
      return false;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return false;
    }

    if (formData.password !== formData.password_confirm) {
      setError("Passwords do not match");
      return false;
    }

    if (!formData.consent_datastore) {
      setError("You must consent to data storage to register");
      return false;
    }
    if (!sanitizeToken(turnstileToken)) {
      setError("Please complete the security challenge");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const sanitizedSubmission = buildSanitizedPayload(formData);
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...sanitizedSubmission,
          cf_turnstile_response: sanitizeToken(turnstileToken),
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Registration failed" }));
        setError(errorData.error || "Registration failed");
      } else {
        setIsSuccess(true);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      if (process.env.NODE_ENV === "development") {
        console.error("Registration error:", err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex items-center justify-center py-24 px-4">
        <div className="w-full max-w-2xl p-8 glass border-white/10 rounded-3xl shadow-2xl">
          <div className="text-center py-8 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-emerald-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              {t("registration_complete")}
            </h3>
            <p className="text-white/60 mb-4">
              {t("welcome_to_tenkei")}
              <span className="text-emerald-500 font-semibold mx-1">
                {formData.name}
              </span>
              !
            </p>
            <p className="text-white/60 mb-8">{t("dojocho_contact_shortly")}</p>
            <Link
              href="/"
              className="inline-block px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-white/90 transition-all transform hover:scale-105"
            >
              {t("return_to_site")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-24 px-4">
      <div className="w-full max-w-2xl p-8 glass border-white/10 rounded-3xl shadow-2xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-white mb-4">
            {t("tenkei_registration")}
          </h1>
          <p className="text-white/60">{t("complete_profile_register")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <svg
                className="w-5 h-5 text-red-500 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {error}
            </div>
          )}

          {/* Personal Information Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white border-l-4 border-blue-500 pl-4">
              {t("personal_information")}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-white/70 ml-1"
                >
                  {t("full_name")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-white/20"
                  placeholder={t("your_full_name") as string}
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-white/70 ml-1"
                >
                  {t("email_address")}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-white/20"
                  placeholder="you@domain.com"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="whatsapp"
                  className="block text-sm font-medium text-white/70 ml-1"
                >
                  {t("whatsapp_number")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="whatsapp"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-white/20"
                  placeholder="+62 812 3456 7890"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="date_of_birth"
                  className="block text-sm font-medium text-white/70 ml-1"
                >
                  {t("date_of_birth")}
                </label>
                <input
                  type="date"
                  id="date_of_birth"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          {/* Account Security Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white border-l-4 border-blue-500 pl-4">
              {t("account_security")}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-white/70 ml-1"
                >
                  {t("password")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-white/20"
                  placeholder="••••••••"
                />
                <p className="text-xs text-white/40 ml-1">{t("password_hint")}</p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password_confirm"
                  className="block text-sm font-medium text-white/70 ml-1"
                >
                  {t("confirm_password")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="password_confirm"
                  name="password_confirm"
                  value={formData.password_confirm}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-white/20"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          {/* Training Information Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white border-l-4 border-blue-500 pl-4">
              {t("training_information")}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dojo Dropdown */}
              <div className="space-y-2" ref={dojoRef}>
                <label
                  htmlFor="dojo"
                  className="block text-sm font-medium text-white/70 ml-1"
                >
                  {t("dojo")}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="dojo"
                    name="dojo"
                    value={dojoSearch}
                    onChange={(e) => {
                      const sanitizedValue = sanitizeTextInput(e.target.value);
                      setDojoSearch(sanitizedValue);
                      setFormData((prev) => ({
                        ...prev,
                        dojo: sanitizedValue,
                      }));
                      setDojoOpen(true);
                    }}
                    onFocus={() => setDojoOpen(true)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-white/20"
                    placeholder={t("dojo_placeholder") as string}
                    autoComplete="off"
                  />

                  {dojoOpen && filteredDojos.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                      <ul className="py-2">
                        {filteredDojos.map((dojo) => (
                          <li
                            key={dojo}
                            onClick={() => handleDojoSelect(dojo)}
                            className="px-4 py-2.5 hover:bg-white/5 cursor-pointer text-white/80 hover:text-white transition-colors"
                          >
                            {dojo}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Rank Selection */}
              <div className="space-y-2">
                <label
                  htmlFor="rank"
                  className="block text-sm font-medium text-white/70 ml-1"
                >
                  {t("current_rank")}
                </label>
                <select
                  id="rank"
                  name="rank"
                  value={formData.rank}
                  onChange={handleInputChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all [color-scheme:dark]"
                >
                  <option value="" className="bg-zinc-900">{t("select_rank")}</option>
                  {RANK_OPTIONS.map((rankOption) => (
                    <option key={rankOption} value={rankOption} className="bg-zinc-900">
                      {rankOption}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label
                  htmlFor="last_grading_date"
                  className="block text-sm font-medium text-white/70 ml-1"
                >
                  {t("last_grading_date")}
                </label>
                <input
                  type="date"
                  id="last_grading_date"
                  name="last_grading_date"
                  value={formData.last_grading_date}
                  onChange={handleInputChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white border-l-4 border-blue-500 pl-4">
              {t("emergency_contact")}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label
                  htmlFor="emergency_contact_name"
                  className="block text-sm font-medium text-white/70 ml-1"
                >
                  {t("emergency_contact_name")}
                </label>
                <input
                  type="text"
                  id="emergency_contact_name"
                  name="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={handleInputChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-white/20"
                  placeholder={t("contact_name") as string}
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="emergency_contact_number"
                  className="block text-sm font-medium text-white/70 ml-1"
                >
                  {t("emergency_contact_number")}
                </label>
                <input
                  type="tel"
                  id="emergency_contact_number"
                  name="emergency_contact_number"
                  value={formData.emergency_contact_number}
                  onChange={handleInputChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-white/20"
                  placeholder="+62 xxx xxxx xxxx"
                />
              </div>
            </div>
          </div>

          {/* Medical Information Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white border-l-4 border-blue-500 pl-4">
              {t("medical_information")}
            </h2>

            <div className="space-y-2">
              <label
                htmlFor="medical_conditions"
                className="block text-sm font-medium text-white/70 ml-1"
              >
                {t("medical_conditions")}
              </label>
              <textarea
                id="medical_conditions"
                name="medical_conditions"
                value={formData.medical_conditions}
                onChange={handleInputChange}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-white/20 resize-none"
                placeholder={t("medical_conditions_placeholder") as string}
              />
            </div>
          </div>

          {/* Consent & Agreements Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white border-l-4 border-blue-500 pl-4">
              {t("consent_and_agreements")}
            </h2>

            <div className="space-y-4">
              <label className="flex items-start gap-4 cursor-pointer group">
                <div className="relative flex items-center mt-1">
                    <input
                    type="checkbox"
                    name="consent_datastore"
                    checked={formData.consent_datastore}
                    onChange={handleInputChange}
                    required
                    className="peer w-6 h-6 bg-white/5 border-2 border-white/10 rounded-lg text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer appearance-none checked:bg-blue-500 checked:border-blue-500 transition-all"
                    />
                    <svg className="absolute w-4 h-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100 left-1 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <span className="text-sm text-white/60 group-hover:text-white transition-colors leading-relaxed">
                  {t("consent_datastore_text")}{" "}
                  <span className="text-red-500">*</span>
                </span>
              </label>

              <label className="flex items-start gap-4 cursor-pointer group">
                <div className="relative flex items-center mt-1">
                    <input
                    type="checkbox"
                    name="consent_marketing"
                    checked={formData.consent_marketing}
                    onChange={handleInputChange}
                    className="peer w-6 h-6 bg-white/5 border-2 border-white/10 rounded-lg text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer appearance-none checked:bg-blue-500 checked:border-blue-500 transition-all"
                    />
                    <svg className="absolute w-4 h-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100 left-1 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <span className="text-sm text-white/60 group-hover:text-white transition-colors leading-relaxed">
                  {t("consent_marketing_text")}
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-center py-4">
            <Turnstile
              siteKey={
                process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
                (process.env.NODE_ENV === "development"
                  ? "1x00000000000000000000AA"
                  : "")
              }
              onSuccess={handleTurnstileSuccess}
              options={{ theme: 'dark' }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-white/90 transition-all transform hover:scale-[1.02] active:scale-95 flex justify-center items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-white/5"
          >
            <span className="text-lg">{t("complete_registration")}</span>
            {isLoading && (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
