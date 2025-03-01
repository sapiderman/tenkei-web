import Image from "next/image";

export default function Events() {
  return (
    <div>
      <h2 className="flex justify-center mb-5 text-5xl font-bold">Events </h2>
      <div className="flex justify-center">
        <Image
          className="seminar_image"
          src="/seminar2025.jpeg"
          alt="Tenkei aikidojo seminar 2025"
          width={1000}
          height={150}
          priority
        />
      </div>
    </div>
  );
}
