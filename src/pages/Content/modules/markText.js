import Mark from 'mark.js';
import {autoScroller} from "./autoScroller";


/**
 * Listens for the message specific to mark text
 * @returns {Promise<void>}
 */
export function initMarkJsHandler(){
     chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.cmd === "getFullText") {
            sendResponse({text: document.documentElement.innerText})
            return true;
        }
        if (message.cmd === "markText") {
            markText(message.selectors);
            return true;
        }
     })
}

/**
 * Highlights selectors found in the page
 * TODO: make the options configurable
 * @param {Array<Selector>} selectors - The selectors found on this page
 */
function markText(selectors){
    const mark = new Mark(document.querySelector('body'));
    let options = {
      acrossElements: false,
      separateWordSearch: false,
      ignorePunctuation: ':;. ,-?_(){}[]!\'"+='.split(''),
      accuracy: "partially"
    };
    if(selectors) {
        selectors.forEach((selector) => {
            mark.mark(selector.key, options)
        });
    }
}