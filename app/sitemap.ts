import { MetadataRoute } from "next";
import { languages } from "./i18n/settings";

const BASE_URL = "https://www.tenkeiaikidojo.org";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/about", "/dojos", "/shinjuku", "/register"];
  const sitemapEntries: MetadataRoute.Sitemap = [];

  routes.forEach((route) => {
    languages.forEach((lang) => {
      sitemapEntries.push({
        url: `${BASE_URL}/${lang}${route}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: route === "" ? 1 : 0.8,
      });
    });
  });

  return sitemapEntries;
}
