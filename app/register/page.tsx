"use client";

import { useState, useRef, useEffect, ChangeEvent, FormEvent } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { filterXSS } from "xss";

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

const RANK_OPTIONS = [
  "10th Kyu",
  "9th Kyu",
  "8th Kyu",
  "7th Kyu",
  "6th Kyu",
  "5th Kyu",
  "4th Kyu",
  "3rd Kyu",
  "2nd Kyu",
  "1st Kyu",
  "Shodan (1st Dan)",
  "Nidan (2nd Dan)",
  "Sandan (3rd Dan)",
  "Yondan (4th Dan)",
  "Godan (5th Dan)",
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
  stripControlChars(filterXSS(value.trim(), XSS_OPTIONS));

const sanitizePhoneInput = (value: string) =>
  stripControlChars(value.replace(/[^\d+\s().-]/g, "").trim());

const sanitizeDateInput = (value: string) =>
  stripControlChars(value.replace(/[^0-9-]/g, "").trim());

const sanitizePasswordInput = (value: string) => stripControlChars(value);

const sanitizeToken = (value: string) => stripControlChars(value.trim());

const buildSanitizedPayload = (data: RegisterFormData) => ({
  name: sanitizeTextInput(data.name),
  email: sanitizeTextInput(data.email),
  whatsapp: sanitizePhoneInput(data.whatsapp),
  date_of_birth: sanitizeDateInput(data.date_of_birth),
  password: sanitizePasswordInput(data.password),
  password_confirm: sanitizePasswordInput(data.password_confirm),
  dojo: sanitizeTextInput(data.dojo),
  rank: sanitizeTextInput(data.rank),
  last_grading_date: sanitizeDateInput(data.last_grading_date),
  emergency_contact_name: sanitizeTextInput(data.emergency_contact_name),
  emergency_contact_number: sanitizePhoneInput(data.emergency_contact_number),
  medical_conditions: sanitizeTextInput(data.medical_conditions),
  consent_datastore: data.consent_datastore,
  consent_marketing: data.consent_marketing,
});

export default function RegisterPage() {
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

    setFormData((prev: RegisterFormData) => ({ ...prev, [name]: sanitizedValue }));

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
      const dob = new Date(formData.date_of_birth);
      const today = new Date();
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
          "cf-turnstile-response": sanitizeToken(turnstileToken),
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
      <div className="bg-gradient-to-br from-zinc-50 to-slate-200 min-h-screen flex items-center justify-center font-sans text-gray-900 py-12 px-4">
        <div className="w-full max-w-2xl p-8 bg-white/80 backdrop-blur-md border border-white/50 rounded-2xl shadow-2xl">
          <div className="text-center py-8 fade-in">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-emerald-600"
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
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Registration Complete!
            </h3>
            <p className="text-gray-600 mb-4">
              Welcome to the dojo,{" "}
              <span className="text-emerald-600 font-semibold">
                {formData.name}
              </span>
              !
            </p>
            <p className="text-gray-600 mb-6">
              A confirmation has been sent to your WhatsApp.
            </p>
            <a
              href="https://tenkeiaikidojo.org"
              className="inline-block bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold py-2 px-6 rounded-lg transition-all shadow-lg shadow-emerald-500/20"
            >
              Return to site
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-zinc-50 to-slate-200 min-h-screen flex items-center justify-center font-sans text-gray-900 py-12 px-4">
      <div className="w-full max-w-2xl p-8 bg-white/80 backdrop-blur-md border border-white/50 rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-emerald-600">
            Tenkei Registration
          </h1>
          <p className="text-gray-500 mt-2">
            Complete your profile to register.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2 fade-in animate-in">
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
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
              Personal Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
                  placeholder="Your full name"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
                  placeholder="you@domain.com"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700">
                  WhatsApp Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="whatsapp"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
                  placeholder="+62 812 3456 7890"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700">
                  Date of Birth
                </label>
                <input
                  type="date"
                  id="date_of_birth"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Account Security Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
              Account Security
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
                  placeholder="••••••••"
                />
                <p className="text-xs text-gray-500">
                  Must be at least 8 characters, a password manager is highly
                  recommended.
                </p>
              </div>

              <div className="space-y-1">
                <label htmlFor="password_confirm" className="block text-sm font-medium text-gray-700">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="password_confirm"
                  name="password_confirm"
                  value={formData.password_confirm}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          {/* Training Information Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
              Training Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Dojo Dropdown */}
              <div className="space-y-1" ref={dojoRef}>
                <label htmlFor="dojo" className="block text-sm font-medium text-gray-700">
                  Dojo
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
                      setFormData((prev) => ({ ...prev, dojo: sanitizedValue }));
                      setDojoOpen(true);
                    }}
                    onFocus={() => setDojoOpen(true)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
                    placeholder="Click to select or type your dojo"
                    autoComplete="off"
                  />

                  {dojoOpen && filteredDojos.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                      <ul className="py-1">
                        {filteredDojos.map((dojo) => (
                          <li
                            key={dojo}
                            onClick={() => handleDojoSelect(dojo)}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-800 transition-colors"
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
              <div className="space-y-1">
                <label htmlFor="rank" className="block text-sm font-medium text-gray-700">
                  Current Rank
                </label>
                <select
                  id="rank"
                  name="rank"
                  value={formData.rank}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="">Select your rank</option>
                  {RANK_OPTIONS.map((rankOption) => (
                    <option key={rankOption} value={rankOption}>
                      {rankOption}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label htmlFor="last_grading_date" className="block text-sm font-medium text-gray-700">
                  Last Grading Date
                </label>
                <input
                  type="date"
                  id="last_grading_date"
                  name="last_grading_date"
                  value={formData.last_grading_date}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
              Emergency Contact
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="emergency_contact_name" className="block text-sm font-medium text-gray-700">
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  id="emergency_contact_name"
                  name="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
                  placeholder="Contact name"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="emergency_contact_number" className="block text-sm font-medium text-gray-700">
                  Emergency Contact Number
                </label>
                <input
                  type="tel"
                  id="emergency_contact_number"
                  name="emergency_contact_number"
                  value={formData.emergency_contact_number}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
                  placeholder="+62 xxx xxxx xxxx"
                />
              </div>
            </div>
          </div>

          {/* Medical Information Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
              Medical Information
            </h2>

            <div className="space-y-1">
              <label htmlFor="medical_conditions" className="block text-sm font-medium text-gray-700">
                Medical Conditions
              </label>
              <textarea
                id="medical_conditions"
                name="medical_conditions"
                value={formData.medical_conditions}
                onChange={handleInputChange}
                rows={3}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400 resize-none"
                placeholder="(Optional) Please list any medical conditions, allergies, or injuries we should be aware of ex: asthma"
              />
            </div>
          </div>

          {/* Consent & Agreements Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
              Consent & Agreements
            </h2>

            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="consent_datastore"
                  checked={formData.consent_datastore}
                  onChange={handleInputChange}
                  required
                  className="mt-1 w-5 h-5 bg-white border-2 border-gray-300 rounded text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                  I consent to the storage and processing of my personal data
                  for membership purposes.{" "}
                  <span className="text-red-500">*</span>
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="consent_marketing"
                  checked={formData.consent_marketing}
                  onChange={handleInputChange}
                  className="mt-1 w-5 h-5 bg-white border-2 border-gray-300 rounded text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                  (Optional) I would like to receive news, updates, and
                  promotional emails.
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-center">
            <Turnstile
              siteKey={
                process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
                (process.env.NODE_ENV === "development"
                  ? "1x00000000000000000000AA"
                  : "")
              }
              onSuccess={handleTurnstileSuccess}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-3 rounded-lg shadow-lg shadow-blue-500/20 transition-all transform active:scale-95 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Complete Registration</span>
            {isLoading && (
              <svg
                className="w-5 h-5 animate-spin text-white/80"
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
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            )}
          </button>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-blue-600 hover:text-blue-500 underline"
            >
              Sign in
            </a>
          </p>
        </form>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .fade-in {
          animation: fadeIn 0.5s ease-in;
        }
      `}</style>
    </div>
  );
}
