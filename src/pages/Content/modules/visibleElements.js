/**
 * Extracts the text from the html elements shown on the screen.
 * @returns {string}
 */
export function getVisibleText() {
  const nonTextHtmlTags = {
    AREA: false,
    BASE: false,
    BR: false,
    COL: false,
    COLGROUP: false,
    EMBED: false,
    HEAD: false,
    HR: false,
    HTML: false,
    IMG: false,
    INPUT: false,
    LINK: false,
    META: false,
    PARAM: false,
    SCRIPT: false,
    STYLE: false,
    SOURCE: false,
    TRACK: false,
    WBR: false,
  };

  const seenText = new Set();
  const outputTexts = [];
  const visibleElements = findAllVisibleElements();

  visibleElements.forEach((element) => {
    const tag = element.tagName.toUpperCase();
    if (
      nonTextHtmlTags[tag] === false ||
      isNonStandardTag(element) ||
      !isElementVisible(element)
    ) {
      return;
    }

    const text = element.innerText?.trim();
    if (!text || text.length === 0) return;

    // Normalize whitespace and remove repeated inner spaces
    const cleaned = text.replace(/\s+/g, ' ').trim();

    // Avoid adding if this exact cleaned text is already seen
    if (!seenText.has(cleaned)) {
      seenText.add(cleaned);
      outputTexts.push(cleaned);
    }
  });
  return outputTexts.join(' || ');
}

/**
 * Return true if the element is in the viewport.
 * @param el
 * @returns {boolean}
 */
function isElementInViewport(el) {
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Get all the elements visible on the screen
 * @returns {*[]}
 */
export function findAllVisibleElements() {
  return [...document.querySelectorAll('*')].filter(isElementInViewport);
}

/**
 * Advanced SPAs have elements that are custom that must be filtered to reduce data noise
 * @type {Set<string>}
 */
const standardTags = new Set([
  'a',
  'abbr',
  'address',
  'area',
  'article',
  'aside',
  'audio',
  'b',
  'base',
  'bdi',
  'bdo',
  'blockquote',
  'body',
  'br',
  'button',
  'canvas',
  'caption',
  'cite',
  'code',
  'col',
  'colgroup',
  'data',
  'datalist',
  'dd',
  'del',
  'details',
  'dfn',
  'dialog',
  'div',
  'dl',
  'dt',
  'em',
  'embed',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'head',
  'header',
  'hr',
  'html',
  'i',
  'iframe',
  'img',
  'input',
  'ins',
  'kbd',
  'label',
  'legend',
  'li',
  'link',
  'main',
  'map',
  'mark',
  'meta',
  'meter',
  'nav',
  'noscript',
  'object',
  'ol',
  'optgroup',
  'option',
  'output',
  'p',
  'param',
  'picture',
  'pre',
  'progress',
  'q',
  'rp',
  'rt',
  'ruby',
  's',
  'samp',
  'script',
  'section',
  'select',
  'small',
  'source',
  'span',
  'strong',
  'style',
  'sub',
  'summary',
  'sup',
  'table',
  'tbody',
  'td',
  'template',
  'textarea',
  'tfoot',
  'th',
  'thead',
  'time',
  'title',
  'tr',
  'track',
  'u',
  'ul',
  'var',
  'video',
  'wbr',
]);

/**
 * Check if the name of the tagged element is non-standard
 * @param element
 * @returns {boolean}
 */
function isNonStandardTag(element) {
  return !standardTags.has(element.tagName.toLowerCase());
}

/**
 * Checks whether the element is hidden / not visible
 * @param element
 * @returns {boolean}
 */
function isElementVisible(element) {
  const style = window.getComputedStyle(element);
  if (
    style.display === 'none' ||
    style.opacity === '0' ||
    style.visibility === 'hidden'
  ) {
    return false;
  }
  return true;
}
