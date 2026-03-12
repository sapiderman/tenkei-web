import { getT } from "@/app/i18n";

export default async function FAQ({ lang }: { lang: string }) {
  const { t } = await getT(lang, "common");

  const faqs = [
    {
      question: t("faq_q1"),
      answer: t("faq_a1"),
    },
    {
      question: t("faq_q2"),
      answer: t("faq_a2"),
    },
    {
      question: t("faq_q3"),
      answer: t("faq_a3"),
    },
    {
      question: t("faq_q4"),
      answer: t("faq_a4"),
    },
  ];

  return (
    <section className="py-24 bg-zinc-950/50">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-sm font-semibold text-blue-500 uppercase tracking-widest mb-4">
            FAQ
          </h2>
          <h3 className="text-4xl font-bold tracking-tight">{t("faq_subtitle")}</h3>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <details key={index} className="group glass border-white/5 rounded-2xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between p-6 cursor-pointer select-none">
                <h4 className="font-bold text-lg">{faq.question}</h4>
                <span className="relative ml-1.5 h-5 w-5 flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute inset-0 h-5 w-5 opacity-100 group-open:opacity-0 transition-opacity"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute inset-0 h-5 w-5 opacity-0 group-open:opacity-100 transition-opacity"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </span>
              </summary>
              <div className="px-6 pb-6 text-white/60 leading-relaxed border-t border-white/5 pt-4">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
