import Image from "next/image";

export default function Events() {
  return (
    <div>
      <h2 className="flex justify-center mb-5 text-5xl font-bold">Events </h2>
      <div className="relative w-full aspect-[16/9]">
        <Image
          src="https://asset.tenkeiaikidojo.org/events/ramadhan.png"
          alt="Ramadhan greeting from Tenkei Aikidojo"
          fill
          sizes="100vw"
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}
