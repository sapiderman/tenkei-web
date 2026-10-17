import { describe, expect, it } from "vitest";
import { pageMetadata, SITE_URL } from "./seo";

describe("pageMetadata", () => {
  it("points canonical and every hreflang at the same page in each locale", () => {
    const meta = pageMetadata("id", "/dojos", "Judul", "Deskripsi");
    expect(meta.alternates?.canonical).toBe(`${SITE_URL}/id/dojos`);
    expect(meta.alternates?.languages).toEqual({
      en: `${SITE_URL}/en/dojos`,
      id: `${SITE_URL}/id/dojos`,
      ja: `${SITE_URL}/ja/dojos`,
      "x-default": `${SITE_URL}/en/dojos`,
    });
  });

  it("handles the homepage (empty path) and sizes the OG image 1200x630", () => {
    const meta = pageMetadata("ja", "", "タイトル", "説明");
    expect(meta.alternates?.canonical).toBe(`${SITE_URL}/ja`);
    expect(meta.alternates?.languages?.en).toBe(`${SITE_URL}/en`);
    const og = meta.openGraph;
    if (!og || !("images" in og)) throw new Error("missing og images");
    const first = Array.isArray(og.images) ? og.images[0] : og.images;
    expect(first).toMatchObject({ width: 1200, height: 630 });
  });
});
