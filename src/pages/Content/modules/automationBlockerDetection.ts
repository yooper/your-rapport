/**
 * Tooling to detect if a captcha or similar mechanism is blocking automation.
 * @returns boolean
 */
export function isAutomationBlockerDetected(doc: Document): boolean {
  return (
    isCaptchaPresent(doc) ||
    isCloudflareChallenge(doc) ||
    isAccessDeniedPage(doc)
  );
}

function isCaptchaPresent(doc: Document): boolean {
  // Look for common iframe titles or class names
  const recaptcha = doc.querySelector(
    'iframe[src*="recaptcha"], .g-recaptcha, [data-sitekey]'
  );
  const hcaptcha = doc.querySelector('iframe[src*="hcaptcha"], .h-captcha');

  return !!(recaptcha || hcaptcha);
}

function isCloudflareChallenge(doc: Document): boolean {
  const cfTitle = doc.title.toLowerCase().includes('just a moment');
  const cfRay = doc.querySelector('div[id="cf-wrapper"], div[class*="cf-error"]');
  const cfJsChallenge = doc.querySelector(
    'script[src*="/cdn-cgi/challenge-platform"]'
  );

  return cfTitle || !!(cfRay || cfJsChallenge);
}

function isAccessDeniedPage(doc: Document): boolean {
  const keywords: string[] = [
    'access denied',
    'verify you are human',
    'are you a robot',
    'are you human',
    'hmm, this page',
    '404',
  ];

  const bodyText = doc.body?.innerText.toLowerCase() ?? '';
  return keywords.some((keyword) => bodyText.includes(keyword));
}
