import Image from "next/image";
import Link from "next/link";
import "../globals.css";
import Footer from "../../components/footer";

export default function Dojo() {
  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <h1 className="mb-1 text-5xl font-bold"> About Tenkei Aikidojo </h1>
        <p className="text-justify">
          Tenkei Aikidojo is a group of dojos under the guidance of Sensei Eka
          Machdi Ramdani (4th Dan), which is the Indonesian branch of Shinjuku
          Aikikai Dojo. Tenkei dojo emphasizes Aikido training by exploring the
          principles, concepts, and philosophies of Aiki in every techniques
          learned, and aim to maintain and continue the philosophies and
          attitudse of O Sensei Morihei Ueshiba (Founder of Aikido) in daily
          practice and life.
        </p>
        <Link href="https://blog.tenkeiaikidojo.org/2013/07/sejarah-tenkei-aikidojo.html">
          Read more here
        </Link>
      </main>
      <Footer />
    </>
  );
}
