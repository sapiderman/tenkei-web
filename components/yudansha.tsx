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
    name: "Anton Kurniawan",
    rank: "Sandan",
    date: "2025",
  },
  {
    name: "Budhi Widagdo",
    rank: "Sandan",
    date: "2025",
  },
  {
    name: "A. R. Junaidi",
    rank: "Sandan",
    date: "2025",
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
    name: "Satrio Agung Wicaksono",
    rank: "Nidan",
    date: "2025",
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
  {
    name: "Dipaprana Supriyatno",
    rank: "Shodan",
    date: "2025",
  },
  {
    name: "Sholia Hajar",
    rank: "Shodan",
    date: "2025",
  },
  {
    name: "Achmad Fabiansyah Prapriatna",
    rank: "Shodan",
    date: "2025",
  },
  {
    name: "Aglis Rausanfikri",
    rank: "Shodan",
    date: "2025",
  },
  {
    name: "Lendi Larici",
    rank: "Shodan",
    date: "2025",
  },
  {
    name: "Valery Sasagawa Palar",
    rank: "Shodan",
    date: "2025",
  },
];

const Yudansha = () => {
  return (
    <div className="w-full">
      <h4 className="text-xl sm:text-2xl font-semibold mb-4">
        Students with Yudansha ranking
      </h4>
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-2 py-2 sm:px-4 sm:py-3">
                No.
              </th>
              <th scope="col" className="px-2 py-2 sm:px-6 sm:py-3">
                Name
              </th>
              <th scope="col" className="px-2 py-2 sm:px-6 sm:py-3">
                Rank
              </th>
              <th scope="col" className="px-2 py-2 sm:px-6 sm:py-3">
                Attained
              </th>
            </tr>
          </thead>
          <tbody>
            {yudansha.map((person, index) => (
              <tr
                key={index}
                className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <td className="px-2 py-2 sm:px-4 sm:py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                  {index + 1}
                </td>
                <td className="px-2 py-2 sm:px-6 sm:py-4">{person.name}</td>
                <td className="px-2 py-2 sm:px-6 sm:py-4">{person.rank}</td>
                <td className="px-2 py-2 sm:px-6 sm:py-4">{person.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <br />
      <a
        href="https://en.wikipedia.org/wiki/Dan_(rank)"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-600 dark:text-blue-500 hover:underline"
      >
        Dan ranking are Shodan = 1st dan, Nidan = 2nd dan, Sandan = 3rd dan,
        Godan = 5th dan.
      </a>
    </div>
  );
};

export default Yudansha;
