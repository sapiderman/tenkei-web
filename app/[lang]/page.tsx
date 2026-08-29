import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { getT } from "../i18n";

import Footer from "@/components/footer";
import Events from "@/components/events";
import { schedules } from "./dojos/data";

export default async function HomePage(props: {
  params: Promise<{ lang: string }>;
}) {
  const params = await props.params;
  const { lang } = params;
  const { t } = await getT(lang, "common");

  // Next.js 16: cookies() is async
  const cookieStore = await cookies();
  const hasSession = Boolean(cookieStore.get("tenkei_session")?.value);

  return (
    <>
      <main>
        {/* Hero */}
        <section className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden">
          <div className="seigaiha absolute inset-0" aria-hidden="true" />
          <div
            className="vertical-kanji absolute right-6 top-1/2 hidden -translate-y-1/2 select-none font-display text-8xl text-ink/15 lg:block"
            aria-hidden="true"
          >
            合気道
          </div>

          <div className="relative mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
            <div className="animate-rise max-w-2xl">
              <Image
                src="/tenkei_logo.png"
                alt="Tenkei Aikidojo"
                width={88}
                height={88}
                className="mb-8 h-20 w-20 object-contain"
                priority
              />
              <h1 className="font-display text-4xl font-bold leading-tight text-ink sm:text-5xl lg:text-6xl">
                {t("hero_statement")}
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/70">
                {t("hero_subline")}
              </p>
            </div>
          </div>
        </section>

        {/* About teaser */}
        <section className="border-t border-hairline">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 md:grid-cols-[1fr_2fr] md:items-start">
            <div>
              <p className="section-label">{t("about_us")}</p>
            </div>
            <div>
              <h2 className="font-display text-3xl font-bold text-ink">
                {t("tenkei_aikidojo")}
              </h2>
              <p className="mt-5 max-w-2xl leading-relaxed text-ink/70">
                {t("tenkei_aikidojo_description")}
              </p>
              <Link
                href={`/${lang}/about`}
                className="mt-6 inline-block border-b border-ai pb-0.5 text-ai transition-colors hover:text-ai-deep hover:border-ai-deep"
              >
                {t("learn_more")}
              </Link>
            </div>
          </div>
        </section>

        {/* Dojos teaser */}
        <section className="border-t border-hairline">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="mb-10 flex items-end justify-between gap-6">
              <div>
                <p className="section-label">{t("dojos")}</p>
                <h2 className="font-display mt-3 text-3xl font-bold text-ink">
                  {t("explore_dojos_desc")}
                </h2>
              </div>
              <Link
                href={`/${lang}/dojos`}
                className="hidden shrink-0 border-b border-ai pb-0.5 text-ai transition-colors hover:text-ai-deep hover:border-ai-deep sm:inline-block"
              >
                {t("learn_more")}
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {schedules.map((dojo) => (
                <Link
                  key={dojo.title}
                  href={`/${lang}/dojos`}
                  className="group rounded-sharp border border-hairline bg-paper p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-ink/30"
                >
                  <h3 className="font-display text-xl font-bold text-ink">
                    {dojo.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/70">
                    {dojo.description}
                  </p>
                  <p className="mt-4 text-xs tracking-wide text-ink/70">
                    {dojo.time}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Shinjuku teaser */}
        <section className="border-t border-hairline">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 md:grid-cols-[1fr_2fr] md:items-start">
            <div>
              <p className="section-label">{t("shinjuku_desc")}</p>
            </div>
            <div>
              <h2 className="font-display text-3xl font-bold text-ink">
                {t("shinjuku_aikikai")}
              </h2>
              <p className="mt-5 max-w-2xl leading-relaxed text-ink/70">
                {t("shinjuku_aikikai_text")}
              </p>
              <Link
                href={`/${lang}/shinjuku`}
                className="mt-6 inline-block border-b border-ai pb-0.5 text-ai transition-colors hover:text-ai-deep hover:border-ai-deep"
              >
                {t("learn_more")}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Events lang={lang} />

      {/* Join band */}
      <section className="bg-ai">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-16 text-center sm:px-6">
          <h2 className="font-display text-3xl font-bold text-paper">
            {t("join_band_title")}
          </h2>
          <p className="mt-4 max-w-xl leading-relaxed text-paper/80">
            {t("join_band_text")}
          </p>
          <Link
            href={`/${lang}/register`}
            className="mt-8 rounded-sharp bg-paper px-8 py-3 font-medium text-ai-deep transition-colors hover:bg-white"
          >
            {t("join_now")}
          </Link>
          <Link
            href={hasSession ? `/${lang}/profile` : `/${lang}/login`}
            className="mt-4 text-sm text-paper/80 underline-offset-4 transition-colors hover:text-paper hover:underline"
          >
            {hasSession ? t("my_profile") : t("sign_in")}
          </Link>
        </div>
      </section>

      <Footer lang={lang} />
    </>
  );
}
