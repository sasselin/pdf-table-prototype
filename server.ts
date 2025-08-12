import { serve } from "bun";
import puppeteer from "puppeteer";
import {
  GenerateCatererProductionReportCase,
  SchoolMealProduction,
} from "./templater/production/production";
import { schoolMealProductionSeed } from "./templater/production/seed";
import {
  GenerateDistributionReportCase,
  schoolDistributionPayload,
  schoolDistributionPayloadSeed,
} from "./templater/distribution/distribution";
import { GenerateVerificationReport } from "./templater/verification/verification";
import { schoolVerificationSeed } from "./templater/verification/seed";

console.log("started");
serve({
  port: 3001,
  async fetch(req) {
    const url = new URL(req.url);

    let templateFile: string | null = null;
    let landscape = true;
    let html = "";

    if (url.pathname === "/") {
      const generator = new GenerateCatererProductionReportCase();
      html = generator.execute(schoolMealProductionSeed, {
        generatedAt: new Date(),
        generatedBy: "Monsieur leTest",
      });
    }
    if (url.pathname === "/distribution") {
      const generator = new GenerateDistributionReportCase();
      html = generator.execute(schoolDistributionPayload);
    }
    if (url.pathname === "/verification") {
      const generator = new GenerateVerificationReport();
      html = generator.execute(schoolVerificationSeed, {
        generatedAt: new Date(),
        generatedBy: "Monsieur leTest",
      });
      landscape = false;
    }

    if (html) {
      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });

      const pdfBuffer = await page.pdf({
        format: "A4",
        landscape: landscape,
        printBackground: true,
        margin: {
          top: "20mm",
          bottom: "20mm",
          left: "10mm",
          right: "10mm",
        },
      });

      await browser.close();

      return new Response(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'inline; filename="rapport-distribution.pdf"',
        },
      });
    }

    return new Response("Not found", { status: 404 });
  },
});
