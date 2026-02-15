import Image from "next/image";

export default function Events() {
  return (
    <div>
      <h2 className="flex justify-center mb-5 text-5xl font-bold">Events </h2>
      <div className="flex justify-center w-full h-[600px]">
        <iframe
          src="/chineseNewYear2026.html"
          className="w-full h-full border-none rounded-lg shadow-lg"
          title="Happy Chinese New Year 2026"
          sandbox="allow-scripts"
        />
      </div>
    </div>
  );
}
