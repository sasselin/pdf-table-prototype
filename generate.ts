import puppeteer from "puppeteer";
import { readFileSync } from "fs";

async function generateDistributionReportPdf() {
  const html = readFileSync("./distribution-template.html", "utf-8");
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    args: ["--no-sandbox", "--disable-setuid-sandbox"], // ✅ nécessaire pour Docker
  });
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: "networkidle0" });

  await page.pdf({
    path: "rapport-distribution.pdf",
    format: "A4",
    landscape: true,
    printBackground: true,
  });

  await browser.close();
}

generateDistributionReportPdf().catch(console.error);
