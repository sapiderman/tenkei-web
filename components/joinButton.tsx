"use client";

export default function JoinButton() {
  return (
    <button
      onClick={() => (window.location.href = "mailto:info@tenkeiaikidojo.org")}
      className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
    >
      Join Now
    </button>
  );
}