/**
 * Tooling to
 * @returns {*|boolean}
 */
export function isAutomationBlockerDetected(){
  return isCaptchaPresent() || isCloudflareChallenge() || isAccessDeniedPage()
}


function isCaptchaPresent() {
  // Look for common iframe titles or class names
  const recaptcha = document.querySelector('iframe[src*="recaptcha"], .g-recaptcha, [data-sitekey]');
  const hcaptcha = document.querySelector('iframe[src*="hcaptcha"], .h-captcha');

  return !!(recaptcha || hcaptcha);
}

function isCloudflareChallenge() {
  const cfTitle = document.title.toLowerCase().includes("just a moment");
  const cfRay = document.querySelector('div[id="cf-wrapper"], div[class*="cf-error"]');
  const cfJsChallenge = document.querySelector('script[src*="/cdn-cgi/challenge-platform"]');

  return cfTitle || !!(cfRay || cfJsChallenge);
}

function isAccessDeniedPage() {
  const keywords = ["access denied", "verify you are human", "are you a robot"];
  const bodyText = document.body.innerText.toLowerCase();
  return keywords.some(keyword => bodyText.includes(keyword));
}



