import React from "react";

const Sensei = () => {
  return (
    <div className="relative overflow-x-auto">
      <h4 className="text-2xl font-semibold">About Sensei Eka</h4>
      <br />
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="py-2 px-4 bg-gray-200 text-left">Year</th>
            <th className="py-2 px-4 bg-gray-200 text-left">Event</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border px-4 py-2">1990</td>
            <td className="border px-4 py-2">
              Started practising Aikido at Dojo Slipi, Kemanggisan
            </td>
          </tr>
          <tr>
            <td className="border px-4 py-2">1993</td>
            <td className="border px-4 py-2">
              Established the Aikido Association at the Universitas Indonesia
            </td>
          </tr>
          <tr>
            <td className="border px-4 py-2">2001</td>
            <td className="border px-4 py-2">
              Officially established UKM Aikido Ul Tenkei Aikidojo
            </td>
          </tr>
          <tr>
            <td className="border px-4 py-2">2013</td>
            <td className="border px-4 py-2">
              Established Tenkei dojo Mayapada, Blok S, and Kemenpora
            </td>
          </tr>
          <tr>
            <td className="border px-4 py-2">2014</td>
            <td className="border px-4 py-2">
              Established Tenkei dojo Ragunan and Tenkei dojo KPK
            </td>
          </tr>
          <tr>
            <td className="border px-4 py-2">2018</td>
            <td className="border px-4 py-2">
              Established Tenkei dojo Menteng
            </td>
          </tr>
          <tr>
            <td className="border px-4 py-2">2019</td>
            <td className="border px-4 py-2">
              Officially became an instructor of Shinjuku Aikikai dojo Japan
            </td>
          </tr>
          <tr>
            <td className="border px-4 py-2">2025</td>
            <td className="border px-4 py-2">
              Attained the rank of Godan (五段)
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default Sensei;
