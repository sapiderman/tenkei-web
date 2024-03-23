import Image from "next/image";
import Link from "next/link";
import "../globals.css";
import Footer from "../../components/footer"

export default function Dojo() {
  return (

    <>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <h1 className="mb-1 text-2xl font-bold"> Lokasi dan Jadwal Dojo </h1>
        <p>
          Dojo dojo Tenkei ada di tempat tempat berikut
        </p>        
        
      </main>
      <Footer />
    </>
  )

}