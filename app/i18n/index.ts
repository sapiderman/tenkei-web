// app/i18n/index.ts
import { cache } from "react";
import { createInstance } from "i18next";
import resourcesToBackend from "i18next-resources-to-backend";

import { getOptions } from "./settings";

const initTranslations = cache(
  async (lng: string, ns: string | string[] = "common") => {
    const i18nInstance = createInstance();
    await i18nInstance
      .use(
        resourcesToBackend(
          (language: string, namespace: string) =>
            import(`../../public/locales/${language}/${namespace}.json`),
        ),
      )
      .init(getOptions(lng, ns));
    return i18nInstance;
  },
);

export async function getT(
  lng: string,
  ns: string | string[] = "common",
  options?: { keyPrefix?: string },
) {
  const i18nInstance = await initTranslations(lng, ns);
  return {
    t: i18nInstance.getFixedT(
      lng,
      Array.isArray(ns) ? ns[0] : ns,
      options?.keyPrefix,
    ),
    i18n: i18nInstance,
  };
}
