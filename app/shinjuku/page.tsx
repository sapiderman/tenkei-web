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
          is located in the Shinjuku area of Tokyo, Japan. Shinjuku Aikikai is a
          member of the Aikikai Foundation, the parent organization of Aikido.
          Shinjuku Aikikai offers classes for adults and children. The
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
