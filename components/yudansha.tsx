type YudanshaProps = {
  name: string;
  rank: string;
  date: string;
};

const yudansha: YudanshaProps[] = [
  {
    name: "alm. Febrizal Lubis",
    rank: "Sandan",
    date: "2018",
  },
  {
    name: "Budhi Widagdo",
    rank: "Nidan",
    date: "2017",
  },
  {
    name: "A. R. Junaidi",
    rank: "Nidan",
    date: "2017",
  },
  {
    name: "Anton Kurniawan",
    rank: "Nidan",
    date: "2018",
  },
  {
    name: "Farman Baihaqi Razif",
    rank: "Nidan",
    date: "2018",
  },
  {
    name: "Muhammad Shaukat",
    rank: "Nidan",
    date: "2023",
  },
  {
    name: "Prama Danawira",
    rank: "Shodan",
    date: "2012",
  },
  {
    name: "Sakinah Tunufus",
    rank: "Shodan",
    date: "2014",
  },
  {
    name: "Adita Rahmi",
    rank: "Shodan",
    date: "2014",
  },
  {
    name: "Akbar Mia",
    rank: "Shodan",
    date: "2015",
  },
  {
    name: "Dyah Amrita",
    rank: "Shodan",
    date: "2015",
  },
  {
    name: "Anton Irawan",
    rank: "Shodan",
    date: "2017",
  },
  {
    name: "A. A. Bagus",
    rank: "Shodan",
    date: "2023",
  },
  {
    name: "Nia Astuti",
    rank: "Shodan",
    date: "2023",
  },
  {
    name: "Andri Gunadi",
    rank: "Shodan",
    date: "2023",
  },
  {
    name: "Abisatyo Rendiawan",
    rank: "Shodan",
    date: "2023",
  },
];

export default function Yudansha() {
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Name
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Rank
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Date
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {yudansha.map((yudansha, index) => (
          <tr key={index}>
            <td className="px-6 py-4 whitespace-nowrap">{yudansha.name}</td>
            <td className="px-6 py-4 whitespace-nowrap">{yudansha.rank}</td>
            <td className="px-6 py-4 whitespace-nowrap">{yudansha.date}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
