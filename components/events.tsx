import { getT } from "../app/i18n";
import EventAccordion, { AccordionItem } from "./EventAccordion";

export default async function Events({ lang }: { lang: string }) {
  const { t } = await getT(lang, "common");

  const eventsData: AccordionItem[] = [
    {
      id: "event-1",
      title: t("event_1_title"),
      description: t("event_1_desc"),
      imageUrl: "https://asset.tenkeiaikidojo.org/events/enbukai_2026.png",
      altText: t("event_1_title"),
    },
    {
      id: "event-2",
      title: t("event_2_title"),
      description: t("event_2_desc"),
      imageUrl: "https://asset.tenkeiaikidojo.org/events/tenkei_family.png",
      altText: t("event_2_title"),
    },
    {
      id: "event-4",
      title: t("event_4_title"),
      description: t("event_4_desc"),
      imageUrl:
        "https://asset.tenkeiaikidojo.org/events/tenkei_kids_aikido.png",
      altText: t("event_4_title"),
    },
    {
      id: "event-5",
      title: t("event_5_title"),
      description: t("event_5_desc"),
      imageUrl:
        "https://asset.tenkeiaikidojo.org/events/tenkei_women_aikido.png",
      altText: t("event_5_title"),
    },
  ];

  return (
    <section className="w-full py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-center mb-10 text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
          {t("events")}
        </h2>
        <EventAccordion items={eventsData} />
      </div>
    </section>
  );
}
