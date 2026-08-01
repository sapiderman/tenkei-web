import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

/** Flat config — replaces legacy .eslintrc.json (core-web-vitals + typescript). */
const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    // ponytail: test-turnstile.js is a standalone CommonJS Playwright
    // debug script — `require()` is correct there, not app code.
    ignores: [".next/**", "node_modules/**", "test-turnstile.js"],
  },
];

export default eslintConfig;
