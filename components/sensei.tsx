import React from "react";
import { getT } from "../app/i18n"; // Adjust path as needed

const Sensei = async ({ lang }: { lang: string }) => {
  const { t } = await getT(lang, "common");
  return (
    <div className="relative overflow-x-auto">
      <h4 className="font-display text-2xl sm:text-3xl font-bold">
        {t("about_sensei_eka")}
      </h4>
      <br />
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="py-2 px-4 text-left text-xs uppercase tracking-widest text-ai-deep border-b border-ink/30">
              {t("year")}
            </th>
            <th className="py-2 px-4 text-left text-xs uppercase tracking-widest text-ai-deep border-b border-ink/30">
              {t("event")}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border-b border-hairline px-4 py-2 align-top">
              1990
            </td>
            <td className="border-b border-hairline px-4 py-2 align-top">
              {t("sensei_event_1990")}
            </td>
          </tr>
          <tr>
            <td className="border-b border-hairline px-4 py-2 align-top">
              1993
            </td>
            <td className="border-b border-hairline px-4 py-2 align-top">
              {t("sensei_event_1993")}
            </td>
          </tr>
          <tr>
            <td className="border-b border-hairline px-4 py-2 align-top">
              2001
            </td>
            <td className="border-b border-hairline px-4 py-2 align-top">
              {t("sensei_event_2001")}
            </td>
          </tr>
          <tr>
            <td className="border-b border-hairline px-4 py-2 align-top">
              2013
            </td>
            <td className="border-b border-hairline px-4 py-2 align-top">
              {t("sensei_event_2013")}
            </td>
          </tr>
          <tr>
            <td className="border-b border-hairline px-4 py-2 align-top">
              2014
            </td>
            <td className="border-b border-hairline px-4 py-2 align-top">
              {t("sensei_event_2014")}
            </td>
          </tr>
          <tr>
            <td className="border-b border-hairline px-4 py-2 align-top">
              2018
            </td>
            <td className="border-b border-hairline px-4 py-2 align-top">
              {t("sensei_event_2018")}
            </td>
          </tr>
          <tr>
            <td className="border-b border-hairline px-4 py-2 align-top">
              2019
            </td>
            <td className="border-b border-hairline px-4 py-2 align-top">
              {t("sensei_event_2019")}
            </td>
          </tr>
          <tr>
            <td className="border-b border-hairline px-4 py-2 align-top">
              2025
            </td>
            <td className="border-b border-hairline px-4 py-2 align-top">
              {t("sensei_event_2025")}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default Sensei;
