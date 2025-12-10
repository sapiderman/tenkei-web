import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/footer";
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
    description: "8th Floor Gedung Parkir Mayapada.",
    location: "https://maps.app.goo.gl/PBLdBLXzEDdMZ8Rt9",
    time: "Mondays: 1930-2130",
    contact: "Anton: +62-815-1650-0-two-six",
  },
  {
    title: "Tenkei Nurul Badar",
    description: "Masjid Nurul Badar Hall, Jl. Raya Pasar Minggu No.9.",
    location: "https://maps.app.goo.gl/7u5St4X79yG8h4H27",
    time: "Tuesdays: 2000-2200, Thursdays Weapons Class: 2000-2200",
    contact: "Muhammad: +62 899-9811-7-five-nine",
  },
];

export default function Dojo() {
  return (
    <>
      <main className="flex min-h-screen flex-col items-left justify-between p-24">
        {/* Flex container to align heading and logo */}
        <div className="flex items-center justify-left gap-4 sm:gap-6">
          {/* Heading - text-center removed as flex container handles centering */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
            Dojo Locations, Schedules and Contacts
          </h1>
          {/* Sized container for the logo */}
          {/* Adjust w-XX h-XX classes to control the logo size (e.g., w-16 h-16 is 64px) */}
          <div className="relative w-10 h-10 sm:w-20 sm:h-20 md:w-24 md:h-24 flex-shrink-0">
            <Image
              src="/tenkei_logo.png"
              alt="Tenkei Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

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
