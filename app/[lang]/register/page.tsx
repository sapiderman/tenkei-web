import type { Metadata } from "next";
import { getT } from "@/app/i18n"; // Correct server entry point
import RegisterForm from "@/components/RegisterForm";
import Header from "@/components/Header";
import Footer from "@/components/footer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const { t } = await getT(lang, "common");
  return {
    title: t("register_page_title"),
    description: t("register_page_description"),
  };
}

export default async function RegisterPage(props: {
  params: Promise<{ lang: string }>;
}) {
  const params = await props.params;
  const { lang } = params;

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-blue-500/30">
      <Header lang={lang} />
      <main className="pt-20">
        <RegisterForm />
      </main>
      <Footer lang={lang} />
    </div>
  );
}
