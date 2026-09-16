import { chromium } from "playwright";
import { RawIngestedJob } from "./greenhouseConnector";

export async function fetchInfoJobsSpain(): Promise<RawIngestedJob[]> {
  const jobs: RawIngestedJob[] = [];
  let browser = null;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 800 },
    });

    const page = await context.newPage();
    await page.goto(
      "https://www.infojobs.net/jobsearch/search-results/list.xhtml?keyword=Frontend",
      { waitUntil: "domcontentloaded", timeout: 25000 }
    );

    // Wait a brief moment for initial cards to mount
    await page.waitForTimeout(2500);

    const scraped = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href*="/of-i"]'));
      const results: { title: string; href: string }[] = [];
      const seen = new Set<string>();

      for (const a of anchors) {
        const text = (a.textContent || "").trim();
        const href = (a as HTMLAnchorElement).href;
        if (text.length > 5 && !seen.has(href)) {
          seen.add(href);
          results.push({ title: text, href });
        }
      }
      return results;
    });

    for (let i = 0; i < scraped.length; i++) {
      const item = scraped[i];
      // InfoJobs URLs usually have location in path: https://www.infojobs.net/barcelona/...
      const locationMatch = item.href.match(/infojobs\.net\/([^/]+)\//);
      const city = locationMatch ? locationMatch[1].replace(/-/g, " ") : "España";

      jobs.push({
        externalId: `ij-es-${Date.now()}-${i}`,
        title: item.title,
        company: "Empresa en InfoJobs",
        location: `${city.charAt(0).toUpperCase() + city.slice(1)}, España`,
        sourceUrl: item.href,
        sourcePlatform: "InfoJobs",
        rawDescription: `Oferta de empleo para ${item.title} en España (${city}). Publicada en InfoJobs.`,
        companySlug: "infojobs",
        regionHint: "SPAIN",
      });
    }

    await browser.close();
    return jobs.slice(0, 15);
  } catch (error) {
    if (browser) await browser.close().catch(() => {});
    console.error("Error scraping InfoJobs Spain:", error);
    return [];
  }
}
