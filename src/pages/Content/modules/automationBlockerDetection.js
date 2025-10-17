/**
 * Tooling to detect is a captcha is blocking
 * @returns {*|boolean}
 */
export function isAutomationBlockerDetected(document) {
  return (
    isCaptchaPresent(document) ||
    isCloudflareChallenge(document) ||
    isAccessDeniedPage(document)
  );
}

function isCaptchaPresent(document) {
  // Look for common iframe titles or class names
  const recaptcha = document.querySelector(
    'iframe[src*="recaptcha"], .g-recaptcha, [data-sitekey]'
  );
  const hcaptcha = document.querySelector(
    'iframe[src*="hcaptcha"], .h-captcha'
  );

  return !!(recaptcha || hcaptcha);
}

function isCloudflareChallenge(document) {
  const cfTitle = document.title.toLowerCase().includes('just a moment');
  const cfRay = document.querySelector(
    'div[id="cf-wrapper"], div[class*="cf-error"]'
  );
  const cfJsChallenge = document.querySelector(
    'script[src*="/cdn-cgi/challenge-platform"]'
  );

  return cfTitle || !!(cfRay || cfJsChallenge);
}

function isAccessDeniedPage(document) {
  const keywords = [
    'access denied',
    'verify you are human',
    'are you a robot',
    'are you human',
    'Hmm, this page',
  ];
  const bodyText = document.body.innerText.toLowerCase();
  return keywords.some((keyword) => bodyText.includes(keyword));
}
