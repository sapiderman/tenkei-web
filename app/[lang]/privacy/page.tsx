import Footer from "@/components/footer";
import { getT } from "@/app/i18n";
import type { Metadata } from "next";

export async function generateMetadata(props: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const { lang } = params;
  const { t } = await getT(lang, "common");
  return {
    title: t("privacy_page_title"),
    description: t("privacy_page_description"),
  };
}

export default async function PrivacyPolicy(props: {
  params: Promise<{ lang: string }>;
}) {
  const params = await props.params;
  const { lang } = params;
  const { t } = await getT(lang, "common");

  return (
    <>
      <main className="flex min-h-screen flex-col items-center px-4 py-16 sm:px-6 max-w-4xl mx-auto">
        <div className="space-y-8 w-full">
          <div className="border-b pb-4">
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold">
              {t("privacy_policy")}
            </h1>
            <p className="text-ink/70 mt-2">{t("privacy_last_updated")}</p>
          </div>

          <section className="space-y-4">
            <h2 className="font-display text-2xl font-bold">
              {t("privacy_intro_title")}
            </h2>
            <p className="text-ink/70 leading-relaxed">
              {t("privacy_intro_text")}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-display text-2xl font-bold">
              {t("privacy_collection_title")}
            </h2>
            <p className="text-ink/70 leading-relaxed">
              {t("privacy_collection_text")}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-display text-2xl font-bold">
              {t("privacy_usage_title")}
            </h2>
            <p className="text-ink/70 leading-relaxed">
              {t("privacy_usage_text")}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-display text-2xl font-bold">
              {t("privacy_security_title")}
            </h2>
            <p className="text-ink/70 leading-relaxed">
              {t("privacy_security_text")}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-display text-2xl font-bold">
              {t("privacy_cookies_title")}
            </h2>
            <p className="text-ink/70 leading-relaxed">
              {t("privacy_cookies_text")}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-display text-2xl font-bold">
              {t("privacy_contact_title")}
            </h2>
            <p className="text-ink/70 leading-relaxed">
              {t("privacy_contact_text")}
            </p>
          </section>
        </div>
      </main>
      <Footer lang={lang} />
    </>
  );
}
