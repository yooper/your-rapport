import * as cheerio from "cheerio";

/**
 * Check if the page was blocked (service-worker friendly).
 * Uses Cheerio to parse the HTML string (no DOM / DOMParser needed).
 */
export function isAutomationBlockerDetectedFromHtml(
  html: string,
  urlHint?: string
): boolean {
  const $ = parseHtmlToCheerio(html, urlHint);

  return isCaptchaPresent($) || isCloudflareChallenge($) || isAccessDeniedPage($);
}

function parseHtmlToCheerio(html: string, urlHint?: string): cheerio.CheerioAPI {
  // Cheerio does not fetch anything; it just parses markup.
  // `baseURI` is not a real concept in cheerio like in DOM, but we can optionally
  // inject a <base> tag to keep parity with your old logic (useful if you later
  // resolve relative URLs manually).
  if (urlHint) {
    const hasHead = /<head[\s>]/i.test(html);
    const hasBase = /<base[\s>]/i.test(html);

    if (hasHead && !hasBase) {
      html = html.replace(/<head(\s[^>]*)?>/i, (m) => `${m}<base href="${escapeAttr(urlHint)}">`);
    }
    else if (!hasHead && !hasBase) {
      // if head is missing, prepend one (best-effort)
      html = `<head><base href="${escapeAttr(urlHint)}"></head>${html}`;
    }
  }

  return cheerio.load(html, {
    decodeEntities: true,
  });
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function isCaptchaPresent($: cheerio.CheerioAPI): boolean {
  const recaptcha = $(
    'iframe[src*="recaptcha"], .g-recaptcha, [data-sitekey]'
  ).length > 0;

  const hcaptcha = $('iframe[src*="hcaptcha"], .h-captcha').length > 0;

  // Case-insensitive attribute contains: use lowercasing heuristics because
  // CSS4 `[attr*="x" i]` is not reliably supported by cheerio/css-select.
  const genericCaptcha =
    $('[id], [class], form[action]').toArray().some((el) => {
      const id = ($(el).attr("id") ?? "").toLowerCase();
      const cls = ($(el).attr("class") ?? "").toLowerCase();
      const action =
        (el.tagName === "form" ? ($(el).attr("action") ?? "") : "").toLowerCase();

      return (
        id.includes("captcha") ||
        cls.includes("captcha") ||
        (action.length > 0 && action.includes("captcha"))
      );
    });

  return recaptcha || hcaptcha || genericCaptcha;
}

function isCloudflareChallenge($: cheerio.CheerioAPI): boolean {
  const title = ($("title").first().text() || "").toLowerCase();

  const cfTitle =
    title.includes("just a moment") || title.includes("attention required");

  const cfWrapper =
    $("#cf-wrapper, #cf-please-wait").length > 0 ||
    // id starts with "cf-"
    $('[id]').toArray().some((el) => (($(el).attr("id") ?? "").toLowerCase().startsWith("cf-")));

  const cfError =
    $('div[class]').toArray().some((el) => {
      const cls = ($(el).attr("class") ?? "").toLowerCase();
      return cls.includes("cf-error") || cls.includes("cf-browser-verification");
    });

  const cfChallengeScript =
    $('script[src*="/cdn-cgi/challenge-platform"]').length > 0;

  const cdnCgiInHtml = $.html()?.includes("/cdn-cgi/") ?? false;

  return Boolean(cfTitle || cfWrapper || cfError || cfChallengeScript || cdnCgiInHtml);
}

function isAccessDeniedPage($: cheerio.CheerioAPI): boolean {
  const keywords: string[] = [
    "access denied",
    "verify you are human",
    "are you a robot",
    "are you human",
    "hmm, this page",
    "permission denied",
    "temporarily unavailable",
    "unusual traffic",
    "request blocked",
    "forbidden",
    "404",
    "something went wrong",
    "page is not found"
  ];

  const titleText = ($("title").first().text() ?? "").toLowerCase();
  const h1Text = ($("h1").first().text() ?? "").toLowerCase();

  // Cheerio text() gives you the document text content (no layout required).
  const bodyText = ($("body").text() ?? "").toLowerCase();

  const haystack = `${titleText}\n${h1Text}\n${bodyText}`;

  return keywords.some((k) => haystack.includes(k));
}
