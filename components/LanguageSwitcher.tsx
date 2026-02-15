"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { languages } from "../app/i18n/settings";

interface LanguageSwitcherProps {
  currentLang: string;
}

export default function LanguageSwitcher({
  currentLang,
}: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const changeLanguage = (lang: string) => {
    if (lang === currentLang) {
      setIsOpen(false);
      return;
    }

    const segments = pathname.split("/").filter(Boolean);
    // If the first segment is a known language code, replace it.
    // Otherwise, prepend the new language.
    // However, existing logic (and i18n usually) implies the first segment IS the lang.
    // Let's stick to the previous robust logic or simplify if we trust the structure.

    // Previous logic was:
    // const pathSegments = window.location.pathname.split("/").filter(Boolean);
    // if (pathSegments.length > 1 && pathSegments[0] === currentLang) ...
    // Let's use the current pathname from usePathname() which is safer in Next.js

    let newPath = "";
    if (segments.length > 0 && languages.includes(segments[0])) {
      newPath = `/${lang}/${segments.slice(1).join("/")}`;
    } else {
      // Fallback/Edge case: just prepend
      newPath = `/${lang}${pathname}`;
    }

    router.push(newPath);
    setIsOpen(false);
  };

  const labels: Record<string, string> = {
    en: "English",
    id: "Indonesia",
    ja: "日本語",
  };

  return (
    <div className="fixed top-4 right-4 z-50 text-left" ref={dropdownRef}>
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white/90 px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 backdrop-blur-sm transition-all"
          id="language-menu-button"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-4 w-4 my-auto text-gray-500"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S12 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S12 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"
            />
          </svg>
          {currentLang.toUpperCase()}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m19.5 8.25-7.5 7.5-7.5-7.5"
            />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div
          className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in slide-in-from-top-1 duration-200"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="language-menu-button"
          tabIndex={-1}
        >
          <div className="py-1" role="none">
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => changeLanguage(lang)}
                className={`block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors ${currentLang === lang
                    ? "bg-gray-50 font-semibold text-indigo-600"
                    : ""
                  }`}
                role="menuitem"
                tabIndex={-1}
              >
                {labels[lang] || lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
