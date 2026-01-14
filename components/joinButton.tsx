"use client";

export default function JoinButton() {
  return (
    <button
      onClick={() => (window.location.href = "https://rei.tenkeiaikidojo.org/v1/register")}
      className="mt-4 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-700"
    >
      Join Now
    </button>
  );
}
