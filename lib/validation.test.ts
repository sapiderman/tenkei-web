import { describe, it, expect } from "vitest";
import { categoryFieldsMissing } from "./validation";

// Table mirrors the Go test table (tenkei-backend internal/types/user_test.go
// TestCategoryFieldsMissing) — keep the two in sync.
type CategoryFields = Parameters<typeof categoryFieldsMissing>[1];

const filled: CategoryFields = {
  university: "Universitas Indonesia",
  faculty: "Fakultas Teknik",
  major: "Teknik Elektro",
  schoolName: "SMA Negeri 1",
  guardianName: "Ibu Sri",
};
const schoolOnly: CategoryFields = {
  university: "",
  faculty: "",
  major: "",
  schoolName: "SMA Negeri 1",
  guardianName: "",
};
const guardianOnly: CategoryFields = {
  university: "",
  faculty: "",
  major: "",
  schoolName: "",
  guardianName: "Ibu Sri",
};
const empty: CategoryFields = {
  university: "",
  faculty: "",
  major: "",
  schoolName: "",
  guardianName: "",
};

const tests: Array<[string, string, CategoryFields, boolean]> = [
  // regular: every field empty is the only OK state.
  ["regular all empty", "regular", empty, false],
  ["regular with university", "regular", { ...empty, university: "UI" }, true],
  ["regular with faculty", "regular", { ...empty, faculty: "Teknik" }, true],
  ["regular with major", "regular", { ...empty, major: "Elektro" }, true],
  ["regular with school", "regular", schoolOnly, true],
  ["regular with guardian", "regular", guardianOnly, true],

  // student university path: university+faculty+major set, rest empty.
  [
    "student university path",
    "student",
    { ...empty, university: "UI", faculty: "Fakultas Teknik", major: "Teknik Elektro" },
    false,
  ],
  [
    "student missing university",
    "student",
    { ...empty, faculty: "Fakultas Teknik", major: "Teknik Elektro" },
    true,
  ],
  [
    "student missing faculty",
    "student",
    { ...empty, university: "UI", major: "Teknik Elektro" },
    true,
  ],
  [
    "student missing major",
    "student",
    { ...empty, university: "UI", faculty: "Fakultas Teknik" },
    true,
  ],
  ["student nothing", "student", empty, true],

  // student school path: schoolName set, university fields empty.
  ["student school path", "student", schoolOnly, false],
  [
    "student school plus university (both paths)",
    "student",
    { ...filled, guardianName: "" },
    true,
  ],
  [
    "student school plus major",
    "student",
    { ...schoolOnly, major: "Teknik Elektro" },
    true,
  ],
  [
    "student university path with guardian",
    "student",
    { ...empty, university: "UI", faculty: "Fakultas Teknik", major: "Teknik Elektro", guardianName: "Ibu Sri" },
    true,
  ],
  [
    "student school path with guardian",
    "student",
    { ...schoolOnly, guardianName: "Ibu Sri" },
    true,
  ],

  // kids: guardian set, all student fields empty.
  ["kids with guardian", "kids", guardianOnly, false],
  ["kids missing guardian", "kids", empty, true],
  [
    "kids with university",
    "kids",
    { ...guardianOnly, university: "UI" },
    true,
  ],
  ["kids with school", "kids", { ...guardianOnly, schoolName: "SMA Negeri 1" }, true],
  ["kids guardian only via full struct", "kids", { ...empty, guardianName: "Ibu Sri" }, false],

  // unknown/empty category: fail-closed.
  ["unknown category", "alumni", empty, true],
  ["unknown category filled", "alumni", filled, true],
  ["empty category", "", empty, true],
];

describe("categoryFieldsMissing", () => {
  it.each(tests)("%s", (_name, category, fields, want) => {
    expect(categoryFieldsMissing(category, fields)).toBe(want);
  });
});
