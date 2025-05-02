import Link from "next/link";
import "../globals.css";
import Footer from "../../components/footer";
import JoinButton from "@/components/joinButton";

type Schedule = {
  title: string;
  description: string;
  location: string;
  time: string;
  contact: string;
};

const schedules: Schedule[] = [
  {
    title: "Tenkei Universitas Indonesia",
    description: "Pusat Kegiatan Mahasiswa Universitas Indonesia, Depok.",
    location: "https://maps.app.goo.gl/fqy3Cek7FYJbf8Bj6",
    time: "Tuesdays and Thursdays: 1600-1800. Saturday Children: 1100-1200, Saturday Adults: 1300-1500, Saturday Weapons Class: 1530-1640",
    contact: "Lia: +62-856-9329-55-four-five, April: +62-896-5227-71-zero-five",
  },
  {
    title: "Tenkei Taman Menteng",
    description:
      "Area in front of Masjid Al-Hakim, Taman Menteng, Jl. Sidoarjo, Jakarta Pusat.",
    location: "https://maps.app.goo.gl/44edxBBAEDh4GK1d8",
    time: "Wednesdays: 1930-2130",
    contact: "Uci: +62-818-412-2-two-two",
  },
  {
    title: "Tenkei Mayapada",
    description: "9th Floor Gedung Parkir Mayapada.",
    location: "https://maps.app.goo.gl/PBLdBLXzEDdMZ8Rt9",
    time: "Mondays: 1930-2130",
    contact: "Anton: +62-815-1650-0-two-six",
  },
  {
    title: "Tenkei Nurul Badar",
    description: "Masjid Nurul Badar Hall, Jl. Raya Pasar Minggu No.9.",
    location: "https://maps.app.goo.gl/72veKMAMBDrf8hCp7",
    time: "Tuesdays: 2000-2200, Wednesdays Weapons Class: 2000-2200",
    contact: "Muhammad: +62 899-9811-7-five-nine",
  },
];

export default function Dojo() {
  return (
    <>
      <main className="flex min-h-screen flex-col items-left justify-between p-24">
        <h1 className="mb-1 text-2xl font-bold">
          {" "}
          Dojo Locations, Schedules and Contacts{" "}
        </h1>

        {schedules.map((schedule, index) => (
          <div key={index} className="my-4">
            <h2 className="text-lg font-bold">{schedule.title}</h2>
            <p>{schedule.description}</p>
            <Link
              className="underline text-blue-600 hover:text-blue-800 visited:text-purple-600"
              href={schedule.location}
            >
              {schedule.location}
            </Link>
            <p>{schedule.time}</p>
            <p>{schedule.contact}</p>
          </div>
        ))}
        <JoinButton />
      </main>

      <Footer />
    </>
  );
}
