import React from "react";
import { getT } from "../app/i18n"; // Adjust path as needed

const Sensei = async ({ lang }: { lang: string }) => {
  const { t } = await getT(lang, "common");
  return (
    <div className="relative overflow-x-auto">
      <h4 className="text-2xl font-semibold">{t("about_sensei_eka")}</h4>
      <br />
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="py-2 px-4 bg-gray-200 text-left">{t("year")}</th>
            <th className="py-2 px-4 bg-gray-200 text-left">{t("event")}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border px-4 py-2">1990</td>
            <td className="border px-4 py-2">{t("sensei_event_1990")}</td>
          </tr>
          <tr>
            <td className="border px-4 py-2">1993</td>
            <td className="border px-4 py-2">{t("sensei_event_1993")}</td>
          </tr>
          <tr>
            <td className="border px-4 py-2">2001</td>
            <td className="border px-4 py-2">{t("sensei_event_2001")}</td>
          </tr>
          <tr>
            <td className="border px-4 py-2">2013</td>
            <td className="border px-4 py-2">{t("sensei_event_2013")}</td>
          </tr>
          <tr>
            <td className="border px-4 py-2">2014</td>
            <td className="border px-4 py-2">{t("sensei_event_2014")}</td>
          </tr>
          <tr>
            <td className="border px-4 py-2">2018</td>
            <td className="border px-4 py-2">{t("sensei_event_2018")}</td>
          </tr>
          <tr>
            <td className="border px-4 py-2">2019</td>
            <td className="border px-4 py-2">{t("sensei_event_2019")}</td>
          </tr>
          <tr>
            <td className="border px-4 py-2">2025</td>
            <td className="border px-4 py-2">{t("sensei_event_2025")}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default Sensei;
