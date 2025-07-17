import { serve } from "bun";
import puppeteer from "puppeteer";

serve({
  port: 80,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/") {
      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      });

      const page = await browser.newPage();
      const html = await Bun.file("./distribution-template.html").text();
      await page.setContent(html, { waitUntil: "networkidle0" });

      const pdfBuffer = await page.pdf({
        format: "A4",
        landscape: true,
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
