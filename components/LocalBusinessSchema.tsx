import React from "react";

interface LocalBusinessSchemaProps {
  // Define props if any parts of the schema become dynamic
}

const LocalBusinessSchema: React.FC<LocalBusinessSchemaProps> = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Tenkei Aikidojo",
    image: "https://www.tenkeiaikidojo.org/tenkei_logo.png",
    url: "https://www.tenkeiaikidojo.org",
    telephone: "+62-856-9329-5545", // Lia's number
    email: "info@tenkeiaikidojo.org",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Gd. pusgiwa, Lt. 1, Kampus Baru Universitas Indonesia,",
      addressLocality: "Depok",
      addressRegion: "Jawa Barat",
      postalCode: "16425",
      addressCountry: "ID", // ISO 3166-1 alpha-2 code for Indonesia
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "-6.360706", // Approximate center of UI Campus
      longitude: "106.829107",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Tuesday", "Thursday"],
        opens: "16:00",
        closes: "18:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "11:00",
        closes: "15:00", // Combining children and adults class
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "15:30",
        closes: "16:40",
      },
    ],
    hasMap: "https://maps.app.goo.gl/fqy3Cek7FYJbf8Bj6",
    priceRange: "$",
    areaServed: {
      "@type": "AdministrativeArea",
      name: "Jakarta",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5",
      reviewCount: "5",
    },
    sameAs: ["https://www.tenkeiaikidojo.org"],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

export default LocalBusinessSchema;
