export const VALID_RANKS = [
  "10th Kyu",
  "9th Kyu",
  "8th Kyu",
  "7th Kyu",
  "6th Kyu",
  "5th Kyu",
  "4th Kyu",
  "3rd Kyu",
  "2nd Kyu",
  "1st Kyu",
  "Shodan (1st Dan)",
  "Nidan (2nd Dan)",
  "Sandan (3rd Dan)",
  "Yondan (4th Dan)",
  "Godan (5th Dan)",
];

/** User categories (new-category.prd) — one per member, dojo-independent. */
export const USER_CATEGORIES = ["regular", "student", "kids"] as const;
export type UserCategory = (typeof USER_CATEGORIES)[number];

/** Dojos a member can train at; shared by the register form and attendance. */
export const DOJO_OPTIONS = [
  "Tenkei Universitas Indonesia",
  "Tenkei Mayapada",
  "Tenkei Taman Menteng",
  "Tenkei Natsu Aikidojo",
];
