import Image from "next/image";
import Link from "next/link";
import "../globals.css";
import Footer from "../../components/footer"

export default function Dojo() {
  return (

    <>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <h1 className="mb-1 text-5xl font-bold"> About Tenkei Aikidojo </h1>
        <p className="text-justify">
          Tenkei Aikidojo adalah kelompok dojo-dojo yang berada di bawah bimbingan Sensei Eka Machdi Ramdani (4th Dan), yang terdaftar langsung sebagai anggota Aikikai Hombu dojo Jepang. Dojo-dojo yang berada dalam Aikikai menekankan latihan Aikido pada penggalian prinsip, konsep, dan falsafah Aiki dalam setiap teknik yang dipelajari, serta bertujuan untuk memelihara dan menghidupkan falsafah dan sikap hidup O Sensei Morihei Ueshiba (Pendiri Aikido) dalam latihan dan hidup sehari-hari.
        </p>
          <Link
            href="https://blog.tenkeiaikidojo.org/2013/07/sejarah-tenkei-aikidojo.html"
          >
            Baca sejarah lengkapnya di sini
          </Link>


        
      </main>
      <Footer />
    </>
  )

}