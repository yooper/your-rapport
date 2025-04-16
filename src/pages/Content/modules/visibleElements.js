/**
 * Extracts the text from the html elements shown on the screen.
 * @returns {string}
 */
export function getVisibleText() {
    /**
     * These tags should not have text data in them.
     * @type {{COL: boolean, HEAD: boolean, META: boolean, IMG: boolean, INPUT: boolean, COLGROUP: boolean, WBR: boolean, STYLE: boolean, EMBED: boolean, HR: boolean, HTML: boolean, PARAM: boolean, TRACK: boolean, BASE: boolean, BR: boolean, AREA: boolean, SCRIPT: boolean, SOURCE: boolean, LINK: boolean}}
     */
    const nonTextHtmlTags = {
        'AREA': false,
        'BASE': false,
        'BR': false,
        'COL': false,
        'COLGROUP': false,
        'EMBED': false,
        'HEAD': false,
        'HR': false,
        'HTML': false,
        'IMG': false,
        'INPUT': false,
        'LINK': false,
        'META': false,
        'PARAM': false,
        'SCRIPT': false,
        'STYLE': false,
        'SOURCE': false,
        'TRACK': false,
        'WBR': false
    };
    const visibleTexts = [];
    const visibleElements = findAllVisibleElements();
    visibleElements.forEach(element => {
        // Exclude elements within script tags
        if (!isNonStandardTag(element) && !(element.tagName.toUpperCase() in nonTextHtmlTags) && isElementVisible(element)) {
            const text = element.innerText?.trim();
            if (text && text.length > 0) {
                // add a space to each side
                visibleTexts.push(` ${text} `);
            }
        }
    });
    // filter duplicates
    const filtered = visibleTexts.filter((value, index, self) => self.indexOf(value) === index);
    // Join all texts with a space and a newline
    return filtered.join('\n');
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
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
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
    "a", "abbr", "address", "area", "article", "aside", "audio", "b", "base", "bdi", "bdo",
    "blockquote", "body", "br", "button", "canvas", "caption", "cite", "code", "col",
    "colgroup", "data", "datalist", "dd", "del", "details", "dfn", "dialog", "div", "dl",
    "dt", "em", "embed", "fieldset", "figcaption", "figure", "footer", "form", "h1", "h2",
    "h3", "h4", "h5", "h6", "head", "header", "hr", "html", "i", "iframe", "img", "input",
    "ins", "kbd", "label", "legend", "li", "link", "main", "map", "mark", "meta", "meter",
    "nav", "noscript", "object", "ol", "optgroup", "option", "output", "p", "param",
    "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "script", "section",
    "select", "small", "source", "span", "strong", "style", "sub", "summary", "sup", "table",
    "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "time", "title", "tr",
    "track", "u", "ul", "var", "video", "wbr"
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
    if (style.display === 'none' || style.opacity === '0' || style.visibility === 'hidden') {
        return false;
    }
    return true;
}