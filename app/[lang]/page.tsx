import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Programs from "@/components/Programs";
import DojoSection from "@/components/DojoSection";
import FAQ from "@/components/FAQ";
import Events from "@/components/events";
import Footer from "@/components/footer";

export default async function HomePage(props: {
  params: Promise<{ lang: string }>;
}) {
  const params = await props.params;
  const { lang } = params;

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-blue-500/30">
      <Header lang={lang} />

      <main>
        <Hero lang={lang} />
        <Programs lang={lang} />
        <DojoSection lang={lang} />
        <Events lang={lang} />
        <FAQ lang={lang} />
      </main>

      <Footer lang={lang} />
    </div>
  );
}
