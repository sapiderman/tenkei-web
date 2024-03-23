export default function Footer() {

  return (
    <footer style={{ backgroundColor: "#363636" }}>
      <div className="mx-auto max-w-7xl overflow-hidden py-5 px-6 lg:px-8">
        <p className="text-xs sm:text-center leading-5 text-gray-400">
          Made with 💖 &copy;2024 Tenkei Aikidojo. All rights reserved.
          <a href="mailto:info@tenkeiaikidojo.org" className="text-blue-500 hover:underline ml-4">
            Contact Us
          </a>
        </p>
      </div>

    </footer>
  );
}