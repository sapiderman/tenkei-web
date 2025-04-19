import Link from "next/link";
import "../globals.css";
import Footer from "@/components/footer";
import Yudansha from "@/components/yudansha";
import Sensei from "@/components/sensei";

export default function About() {
  return (
    <>
      <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-16 lg:p-24 max-w-4xl mx-auto">
        <div className="space-y-6 sm:space-y-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center">
            About Tenkei Aikidojo
          </h1>

          <p className="text-base sm:text-lg leading-relaxed text-gray-800 text-justify sm:text-center">
            Tenkei Aikidojo is a group of dojos under the guidance of Sensei Eka
            Machdi Ramdani (5th Dan), which is the Jakarta branch of Shinjuku
            Aikikai Dojo. Tenkei dojo emphasizes Aikido training by exploring
            the principles, concepts, and philosophies of Aiki in every
            techniques learned, and aims to maintain and continue the
            philosophies and attitudes of O Sensei Morihei Ueshiba (Founder of
            Aikido) in daily practice and life.
          </p>

          <div className="text-center">
            <Link
              href="https://blog.tenkeiaikidojo.org/2013/07/sejarah-tenkei-aikidojo.html"
              className="inline-block px-4 sm:px-6 py-2 sm:py-3 text-base sm:text-lg text-blue-600 hover:text-blue-800 
                       hover:underline transition-colors duration-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              Read more about the history of Tenkei dojo here
            </Link>
          </div>
          <Sensei />
          <Yudansha />
        </div>
      </main>
      <br />
      <Footer />
    </>
  );
}