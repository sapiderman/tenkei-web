// app/i18n/settings.ts
import type { InitOptions } from "i18next";

export const fallbackLng = "en";
export const languages = [fallbackLng, "id", "ja"];
export const defaultNS = "common"; // Default namespace for translations

export function getOptions(
  lng = fallbackLng,
  ns: string | string[] = defaultNS,
): InitOptions {
  return {
    debug: process.env.NODE_ENV === "development",
    supportedLngs: languages,
    fallbackLng,
    lng,
    fallbackNS: defaultNS,
    defaultNS,
    ns,
  };
}
