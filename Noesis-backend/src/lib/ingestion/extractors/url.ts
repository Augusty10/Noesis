import * as cheerio from "cheerio";
import { validateUrl } from "../../security/ssrf-guard";

export interface UrlContent {
  title: string;
  text: string;
}

/**
 * Scrapes a web page, extracts clean text, and filters out boilerplate layout elements.
 */
export async function extractUrl(urlString: string): Promise<UrlContent> {
  const isValid = await validateUrl(urlString);
  if (!isValid) {
    throw new Error("URL violates SSRF safety constraints or is unreachable.");
  }

  const response = await fetch(urlString, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`Web page request failed: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Remove typical non-content elements
  $("script, style, iframe, nav, footer, header, noscript, svg, form, aside").remove();

  const title = $("title").text().trim() || urlString;
  const bodyText = $("body").text();

  // Clean extra spaces and collapse consecutive newlines
  const cleanText = bodyText
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n/g, "\n")
    .trim();

  return {
    title,
    text: cleanText,
  };
}
