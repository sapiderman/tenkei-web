import Image from "next/image";
import Link from "next/link";
import "../globals.css";
import Footer from "../../components/footer";

export default function Dojo() {
  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <h1 className="mb-1 text-5xl font-bold"> About Shinjuku Aikikai </h1>
        <p className="text-justify">
          Tenkei Aikidojo is affiliated with Shinjuku Aikikai. Shinjuku Aikikai
          is located in the Shinjuku area of Tokyo Prefecture, Japan. Shinjuku
          Aikikai is headed by Shinjiro Shusami (6th dan). Shinjuku Aikikai
          offers classes for adults and children. Practice is on Mondays (1st
          and 3rd), Wednesdays at the Shinjuku Cosmic Center 1F and on Fridays
          at the Shinjuku Sports Center 3F, First Martial Arts Hall.
        </p>
        <Link href="https://www.shinjukuaikikai.com/">
          To learn more about Shinjuku Aikika, click here
          https://www.shinjukuaikikai.com/
        </Link>
      </main>
      <Footer />
    </>
  );
}
