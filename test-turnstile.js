const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on("console", (msg) =>
    console.log(`CONSOLE: ${msg.type()} - ${msg.text()}`),
  );
  page.on("pageerror", (err) => console.log(`ERROR: ${err.message}`));

  await page.goto("http://localhost:3000/en/register", {
    waitUntil: "networkidle",
  });

  // wait a bit for Turnstile to inject
  await page.waitForTimeout(2000);

  const turnstilePresent = await page.locator(".cf-turnstile").count();
  console.log(`Turnstile widget count: ${turnstilePresent}`);

  await browser.close();
})();
