import Image from "next/image";
import Link from "next/link";
import "../globals.css";
import Footer from "../../components/footer";

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
    time: "Selasa dan Kamis: 1600-1800. Sabtu Anak: 1000-1130, Sabtu Dewasa: 1300-1500",
    contact: "Lia: 856-9329-55-Empat-Lima, April: 896-5227-71-Nol-Lima",
  },
  {
    title: "Tenkei Taman Menteng",
    description:
      "Pelataran Masjid Al-Hakim, Taman Menteng, Jl. Sidoarjo, Jakarta Pusat.",
    location: "https://maps.app.goo.gl/44edxBBAEDh4GK1d8",
    time: "Rabu: 1930-2130",
    contact: "Uci: 818-412-2-dua-dua",
  },
  {
    title: "Tenkei Mayapada",
    description: "Lantai 9 Gedung Parkir Mayapada.",
    location: "https://maps.app.goo.gl/PBLdBLXzEDdMZ8Rt9",
    time: "Senin: 1930-2130",
    contact: "Anton: 815-1650-0-dua-enam",
  },
];

export default function Dojo() {
  return (
    <>
      <main className="flex min-h-screen flex-col items-left justify-between p-24">
        <h1 className="mb-1 text-2xl font-bold"> Lokasi dan Jadwal Dojo </h1>

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
      </main>
      <Footer />
    </>
  );
}
