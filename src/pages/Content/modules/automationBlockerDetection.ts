/**
 * Check if the page was blocked
 */
export function isAutomationBlockerDetectedFromHtml(html: string, urlHint?: string): boolean {
  const doc = parseHtmlToDocument(html, urlHint);

  return (
    isCaptchaPresent(doc) ||
    isCloudflareChallenge(doc) ||
    isAccessDeniedPage(doc)
  );
}

function parseHtmlToDocument(html: string, urlHint?: string): Document {
  // Parse into an inert Document (not attached to any tab)
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Optional: inject a <base> so relative selectors/logic that might rely on baseURI
  // behave more predictably (this does not fetch anything).
  if (urlHint) {
    const base = doc.createElement("base");
    base.href = urlHint;
    doc.head?.prepend(base);
  }

  return doc;
}

function isCaptchaPresent(doc: Document): boolean {
  // Look for common iframe src patterns and common widget containers
  const recaptcha = doc.querySelector(
    'iframe[src*="recaptcha"], .g-recaptcha, [data-sitekey]'
  );
  const hcaptcha = doc.querySelector('iframe[src*="hcaptcha"], .h-captcha');

  // Some sites render “captcha” in ids/classes without iframes
  const genericCaptcha = doc.querySelector(
    '[id*="captcha" i], [class*="captcha" i], form[action*="captcha" i]'
  );

  return Boolean(recaptcha || hcaptcha || genericCaptcha);
}

function isCloudflareChallenge(doc: Document): boolean {
  const title = (doc.title || "").toLowerCase();

  // Cloudflare challenge / interstitial patterns
  const cfTitle = title.includes("just a moment") || title.includes("attention required");
  const cfWrapper = doc.querySelector('#cf-wrapper, #cf-please-wait, [id^="cf-"]');
  const cfError = doc.querySelector('div[class*="cf-error"], div[class*="cf-browser-verification"]');
  const cfChallengeScript = doc.querySelector('script[src*="/cdn-cgi/challenge-platform"]');

  // Sometimes the marker is in meta or inline scripts
  const cdnCgi = doc.documentElement?.innerHTML.includes("/cdn-cgi/") ?? false;

  return Boolean(cfTitle || cfWrapper || cfError || cfChallengeScript || cdnCgi);
}

function isAccessDeniedPage(doc: Document): boolean {
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
  ];

  // In a parsed HTML Document, innerText can be flaky because layout isn't computed.
  // Use textContent which is reliable in an inert DOM.
  const bodyText = (doc.body?.textContent ?? "").toLowerCase();

  // Also look at title + common headings
  const titleText = (doc.title ?? "").toLowerCase();
  const h1Text = (doc.querySelector("h1")?.textContent ?? "").toLowerCase();

  const haystack = `${titleText}\n${h1Text}\n${bodyText}`;

  return keywords.some((k) => haystack.includes(k));
}

