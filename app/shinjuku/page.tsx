import Link from "next/link";
import Footer from "@/components/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shinjuku Aikikai - Tenkei Aikidojo",
  description:
    "Learn about Shinjuku Aikikai, the Tokyo dojo affiliated with Tenkei Aikidojo",
};

export default function Shinjuku() {
  return (
    <>
      <main className="flex min-h-screen flex-col items-center p-8 md:p-24 max-w-4xl mx-auto">
        <div className="space-y-8">
          <h1 className="text-4xl md:text-5xl font-bold text-center">
            About Shinjuku Aikikai
          </h1>

          <p className="text-lg leading-relaxed text-gray-800">
            Tenkei Aikidojo is affiliated with Shinjuku Aikikai. Shinjuku
            Aikikai is located in the Shinjuku area of Tokyo Prefecture, Japan.
            Shinjuku Aikikai is headed by Shinjiro Shusami (6th dan). Shinjuku
            Aikikai offers classes for adults and children. Practice is on
            Mondays (1st and 3rd), Wednesdays at the Shinjuku Cosmic Center 1F
            and on Fridays at the Shinjuku Sports Center 3F, First Martial Arts
            Hall.
          </p>

          <div className="text-center space-y-4">
            <p className="text-lg font-medium">
              To learn more about Shinjuku Aikikai, visit:
            </p>
            <Link
              className="inline-block px-6 py-3 text-lg text-blue-600 hover:text-blue-800 
                         hover:underline transition-colors duration-200"
              href="https://www.shinjukuaikikai.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              www.shinjukuaikikai.com
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
