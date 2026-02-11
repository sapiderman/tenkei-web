export type Schedule = {
  title: string;
  description: string;
  location: string;
  time: string;
  contact: string;
  ig?: string;
};

export const schedules: Schedule[] = [
  {
    title: "Tenkei Universitas Indonesia",
    description: "Pusat Kegiatan Mahasiswa Universitas Indonesia, Depok.",
    location: "https://maps.app.goo.gl/fqy3Cek7FYJbf8Bj6",
    time: "Tuesdays and Thursdays: 1600-1800. Saturday Children: 1100-1200, Saturday Adults: 1300-1500, Saturday Weapons Class: 1530-1640",
    contact: "Lia: +62-856-9329-55-four-five, April: +62-896-5227-71-zero-five",
    ig: "https://www.instagram.com/tenkeiaikidoui",
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
    title: "Tenkei Natsu Aikidojo",
    description: "Masjid Nurul Badar Hall, Jl. Raya Pasar Minggu No.9.",
    location: "https://maps.app.goo.gl/7u5St4X79yG8h4H27",
    time: "Tuesdays: 2000-2200, Thursdays Weapons Class: 2000-2200",
    contact: "Muhammad: +62 899-9811-7-five-nine",
    ig: "https://www.instagram.com/natsuaikidojo",
  },
];

export const fees = {
  "Registration Fee": "Rp 250,000 (already includes annual fee)",
  "Annual Fee": "Rp 150,000",
  "Monthly Fee (regular)": "Rp 200,000",
  "Examination Fee": "Rp 150,000 (students Rp 100,000)",
};
