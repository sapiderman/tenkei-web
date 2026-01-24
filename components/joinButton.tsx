import Link from "next/link";

export default function JoinButton() {
  return (
    <Link
      href="/register"
      className="mt-4 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-700 block mx-auto text-center w-full md:w-1/2"
    >
      Join Now
    </Link>
  );
}