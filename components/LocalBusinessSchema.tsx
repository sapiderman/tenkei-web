import React from "react";
import { SITE_URL } from "@/lib/seo";

interface LocalBusinessSchemaProps {
  lang: string;
}

const LocalBusinessSchema: React.FC<LocalBusinessSchemaProps> = ({ lang }) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/#localbusiness`,
    name: "Tenkei Aikidojo",
    image: `${SITE_URL}/tenkei_logo.png`,
    url: `${SITE_URL}/${lang}`,
    telephone: "+62-856-9329-5545",
    email: "info@tenkeiaikidojo.org",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Gd. pusgiwa, Lt. 1, Kampus Baru Universitas Indonesia",
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
    // Rough public pricing from the FAQ (registration + monthly training).
    priceRange: "IDR 200,000-250,000",
    areaServed: {
      "@type": "AdministrativeArea",
      name: "Jakarta",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

export default LocalBusinessSchema;
