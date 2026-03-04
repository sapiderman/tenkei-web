import Image from "next/image";
import Link from "next/link";
import { getT } from "../i18n"; // Adjust path for i18n helper

import Footer from "@/components/footer"; // Will need to be updated to be language aware
import Events from "@/components/events"; // Will need to be updated to be language aware

export default async function HomePage(props: {
  params: Promise<{ lang: string }>;
}) {
  const params = await props.params;
  const { lang } = params;
  const { t } = await getT(lang, "common"); // Get translation function for 'common' namespace

  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
          <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4">
            {t("welcome_message")}&nbsp;
          </p>

          <div className="fixed bottom-0 left-0 flex w-full items-end justify-center bg-gradient-to-t from-white via-white lg:static lg:h-auto lg:w-auto lg:bg-none p-4 lg:p-0">
            <div className="relative w-32 h-32 lg:w-48 lg:h-48">
              <Image
                src="/tenkei_logo.png"
                alt="Tenkei Logo"
                fill
                sizes="(max-width: 1024px) 128px, 192px"
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>

        <div className="relative flex place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:lg:h-[360px] z-[-1]">
          <Image
            className="relative"
            src="/tenkei_text_logo.png"
            alt="Tenkei text banner"
            width={1000}
            height={150}
            priority
          />
        </div>

        <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left">
          <Link
            href={`/${lang}/about`} // Update href with lang
            className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100"
          >
            <h2 className={`mb-3 text-2xl font-semibold`}>
              {t("about_us")}{" "}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                -&gt;
              </span>
            </h2>
            <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
              {t("about_tenkei_desc")}
            </p>
          </Link>

          <Link
            href={`/${lang}/dojos`} // Update href with lang
            className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100"
            rel="noopener noreferrer"
          >
            <h2 className={`mb-3 text-2xl font-semibold`}>
              {t("dojos")}{" "}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                -&gt;
              </span>
            </h2>
            <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
              {t("explore_dojos_desc")}
            </p>
          </Link>

          <a
            href="https://blog.tenkeiaikidojo.org/" // External link, no lang change
            className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100"
            target="_blank"
            rel="noopener noreferrer"
          >
            <h2 className={`mb-3 text-2xl font-semibold`}>
              {t("blogs")}{" "}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                -&gt;
              </span>
            </h2>
            <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
              {t("read_blogs_desc")}
            </p>
          </a>

          <Link
            href={`/${lang}/shinjuku`} // Update href with lang
            className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100"
          >
            <h2 className={`mb-3 text-2xl font-semibold`}>
              {t("shinjuku_aikikai")}{" "}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                -&gt;
              </span>
            </h2>
            <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
              {t("shinjuku_desc")}
            </p>
          </Link>
        </div>
      </main>
      <Events lang={lang} />
      <br />
      <Footer lang={lang} />
    </>
  );
}
