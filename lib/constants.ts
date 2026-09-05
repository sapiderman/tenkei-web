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

/**
 * Canonical name of the Universitas Indonesia campus dojo — must match the Go
 * backend's types.UIDojo exactly. Members of this dojo must record faculty
 * and major; the rule is enforced in the form, the BFF proxy, and the backend.
 * The university brands itself "Universitas Indonesia" in every language.
 */
export const UI_DOJO = "Tenkei Universitas Indonesia";

/** True when the dojo is the UI campus — faculty/major become mandatory. */
export const isUIDojo = (dojo: string): boolean => dojo === UI_DOJO;
