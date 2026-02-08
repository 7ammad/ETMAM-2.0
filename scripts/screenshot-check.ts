import { chromium } from "playwright";

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // 1. Login page
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle", timeout: 15000 });
  await page.screenshot({ path: "screenshots/01-login.png", fullPage: true });
  console.log("1/6 login page");

  // 2. Try to login (if credentials exist, enter them)
  const emailInput = page.locator('input[name="email"], input[type="email"]');
  if (await emailInput.isVisible()) {
    await emailInput.fill("7ammad911@gmail.com");
    const passInput = page.locator('input[name="password"], input[type="password"]');
    await passInput.fill("Hhya@1399");
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "screenshots/02-after-login.png", fullPage: true });
    console.log("2/6 after login attempt");
  }

  // 3. Dashboard direct (capture whatever renders)
  await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle", timeout: 15000 });
  await page.screenshot({ path: "screenshots/03-dashboard.png", fullPage: true });
  console.log("3/6 dashboard");

  // 4. Tenders page
  await page.goto("http://localhost:3000/tenders", { waitUntil: "networkidle", timeout: 15000 });
  await page.screenshot({ path: "screenshots/04-tenders.png", fullPage: true });
  console.log("4/6 tenders");

  // 5. Settings page
  await page.goto("http://localhost:3000/settings", { waitUntil: "networkidle", timeout: 15000 });
  await page.screenshot({ path: "screenshots/05-settings.png", fullPage: true });
  console.log("5/6 settings");

  // 6. Check computed font on body
  const fontInfo = await page.evaluate(() => {
    const body = document.body;
    const html = document.documentElement;
    const computed = getComputedStyle(body);
    return {
      bodyFontFamily: computed.fontFamily,
      htmlLang: html.lang,
      htmlDir: html.dir,
      htmlClasses: html.className,
      bodyClasses: body.className,
      fontSansVar: getComputedStyle(html).getPropertyValue("--font-sans"),
      activeFontVar: getComputedStyle(html).getPropertyValue("--active-font"),
      fontCairoVar: getComputedStyle(html).getPropertyValue("--font-cairo"),
      fontNotoKufiVar: getComputedStyle(html).getPropertyValue("--font-noto-kufi"),
      fontCairoOnBody: getComputedStyle(body).getPropertyValue("--font-cairo"),
      fontNotoKufiOnBody: getComputedStyle(body).getPropertyValue("--font-noto-kufi"),
    };
  });
  console.log("\n=== FONT DEBUG ===");
  console.log(JSON.stringify(fontInfo, null, 2));

  await browser.close();
}

capture().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
