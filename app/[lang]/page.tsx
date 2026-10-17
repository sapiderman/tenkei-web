import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getT } from "../i18n";
import { pageMetadata } from "@/lib/seo";

import Events from "@/components/events";
import JoinButton from "@/components/joinButton";
import { schedules } from "./dojos/data";

export async function generateMetadata(props: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await props.params;
  const { t } = await getT(lang, "common");
  return pageMetadata(
    lang,
    "",
    t("site_title"),
    t("tenkei_aikidojo_description"),
  );
}

// Shared "learn more" teaser link styling (About / Dojos / Shinjuku sections)
const TEASER_LINK =
  "border-b border-ai pb-0.5 text-ai transition-colors hover:text-ai-deep hover:border-ai-deep";

export default async function HomePage(props: {
  params: Promise<{ lang: string }>;
}) {
  const params = await props.params;
  const { lang } = params;
  const { t } = await getT(lang, "common");

  const classes = [
    { title: t("class_adult_title"), desc: t("class_adult_desc") },
    { title: t("class_kids_title"), desc: t("class_kids_desc") },
    { title: t("class_weapons_title"), desc: t("class_weapons_desc") },
  ];
  // shortcut: faq_a4 fee figures mirror dojos/data.ts fees, update both when fees change
  const faqs = [
    { q: t("faq_q1"), a: t("faq_a1") },
    { q: t("faq_q2"), a: t("faq_a2") },
    { q: t("faq_q3"), a: t("faq_a3") },
    { q: t("faq_q4"), a: t("faq_a4") },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: { "@type": "Answer", text: item.a },
            })),
          }),
        }}
      />
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
                className={`mt-6 inline-block ${TEASER_LINK}`}
              >
                {t("learn_more")}
              </Link>
            </div>
          </div>
        </section>

        {/* Classes */}
        <section className="border-t border-hairline">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 md:grid-cols-[1fr_2fr] md:items-start">
            <div>
              <p className="section-label">{t("classes_label")}</p>
            </div>
            <div>
              <h2 className="font-display text-3xl font-bold text-ink">
                {t("classes_heading")}
              </h2>
              <div className="mt-6 border-t border-hairline">
                {classes.map((item) => (
                  <div
                    key={item.title}
                    className="border-b border-hairline py-6"
                  >
                    <h3 className="font-display text-xl font-bold text-ink">
                      {item.title}
                    </h3>
                    <p className="mt-2 max-w-2xl leading-relaxed text-ink/70">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
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
                  {t("home_dojos_heading")}
                </h2>
              </div>
              <Link
                href={`/${lang}/dojos`}
                className={`hidden shrink-0 sm:inline-block ${TEASER_LINK}`}
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
              <p className="section-label">{t("shinjuku_label")}</p>
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
                className={`mt-6 inline-block ${TEASER_LINK}`}
              >
                {t("learn_more")}
              </Link>
            </div>
          </div>
        </section>

        {/* Questions */}
        <section className="border-t border-hairline">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 md:grid-cols-[1fr_2fr] md:items-start">
            <div>
              <p className="section-label">{t("faq_label")}</p>
            </div>
            <div>
              <h2 className="font-display text-3xl font-bold text-ink">
                {t("faq_heading")}
              </h2>
              <div className="mt-6 border-t border-hairline">
                {faqs.map((item) => (
                  <details
                    key={item.q}
                    className="group border-b border-hairline"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 [&::-webkit-details-marker]:hidden">
                      <h3 className="font-display text-lg font-bold text-ink">
                        {item.q}
                      </h3>
                      <span
                        className="shrink-0 text-xl text-ai transition-transform duration-200 group-open:rotate-45"
                        aria-hidden="true"
                      >
                        +
                      </span>
                    </summary>
                    <p className="max-w-2xl pb-5 leading-relaxed text-ink/70">
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        <Events lang={lang} />
      </main>

      {/* Join band */}
      <section className="bg-ai">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-16 text-center sm:px-6">
          <h2 className="font-display text-3xl font-bold text-paper">
            {t("join_band_title")}
          </h2>
          <p className="mt-4 max-w-xl leading-relaxed text-paper">
            {t("join_band_text")}
          </p>
          <div className="mt-8">
            <JoinButton lang={lang} variant="dark" />
          </div>
        </div>
      </section>
    </>
  );
}
