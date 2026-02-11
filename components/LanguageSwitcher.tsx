"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "../app/i18n/client";
import { languages } from "../app/i18n/settings";

interface LanguageSwitcherProps {
  currentLang: string;
}

export default function LanguageSwitcher({
  currentLang,
}: LanguageSwitcherProps) {
  const router = useRouter();
  const { t } = useTranslation(currentLang, "common");

  const changeLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    const pathSegments = window.location.pathname.split("/").filter(Boolean);
    let newPath = `/${newLang}`;
    if (pathSegments.length > 1 && pathSegments[0] === currentLang) {
      // Check if currentLang is actually in path
      newPath += `/${pathSegments.slice(1).join("/")}`;
    } else if (pathSegments.length > 0) {
      // Case where path doesn't start with lang (e.g., direct access to /)
      newPath += `/${pathSegments.join("/")}`;
    }
    router.push(newPath);
  };

  return (
    <select onChange={changeLanguage} value={currentLang}>
      {languages.map((lang) => (
        <option key={lang} value={lang}>
          {lang.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
