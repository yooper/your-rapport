import Mark from 'mark.js';

/**
 * Highlights selectors found in the page
 * TODO: make the options configurable
 * @param {Array<Selector>} selectors - The selectors found on this page
 */
function markText(selectors) {
  const mark = new Mark(document.querySelector('body'));
  let options = {
    acrossElements: false,
    separateWordSearch: false,
    ignorePunctuation: ':;. ,-?_(){}[]!\'"+='.split(''),
    accuracy: 'partially',
  };
  if (selectors) {
    selectors.forEach((selector) => {
      mark.mark(selector.key, options);
    });
  }
}
