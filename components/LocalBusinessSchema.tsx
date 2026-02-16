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
    telephone: "+62-856-9329-55-four-five", //
    email: "info@tenkeiaikidojo.org",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Jl. Prof. Dr. Fuad Hassan, Kukusan, Kecamatan Beji",
      addressLocality: "Depok",
      addressRegion: "Jawa Barat",
      postalCode: "16425",
      addressCountry: "ID", // ISO 3166-1 alpha-2 code for Indonesia
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "-6.365200346599992", // Approximate center of Pusgiwa
      longitude: "106.82433803237402",
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
