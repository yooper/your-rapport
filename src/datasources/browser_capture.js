import {getLocalItem, setLocalItem} from "../models/db/local";
import {sha256} from "../utilities/transformers";

/**
 * Capture the tab and persist it into local storage
 * @param tab
 * @param message
 * @returns {Promise<void>}
 */
export async function capture(tab, message = {}){

    let configurationRegistry = await getLocalItem('configuration') ?? { authToken: false, productVersion: 'trial'};
    // get/set the record count
    configurationRegistry.screenShotCount = configurationRegistry?.screenShotCount ?? 0

    const screenShot = await chrome.tabs.captureVisibleTab();
    const uuid = crypto.randomUUID();
    let record = {
      uuid: uuid,
      title: tab.title,
      url: tab.url,
      domain: (new URL(tab.url)).hostname,
      text: message?.text?.toLowerCase() ?? null,
      screenshot: screenShot,
      createdOn: Date.now(),
      updatedOn: Date.now(),
      createdOnLocalTime: new Date().toLocaleString(),
      hash: await sha256(screenShot),
      createdBy: 'TODO-CREATE', // TODO: add support for tracking who created the record, requires authentication
      updatedBy: 'TODO-UPDATE', // TODO: add support for tracking who updated the record, requires authentication
      length: screenShot.length,
      attributes: { tab: tab },
      selectors: [], // TODO: add support for tracking pivots / keywords found in text
      tags: [],  // TODO: add support for tagging data
      caseManagementUuid: '30583002-f730-4383-bf28-fdd8aadcf387', // TODO: add case management functionality
      note: null,
      mhtml_uuid: `mhtml_${uuid}`, // TODO: add support for storing mhtml
      text_uuid: `text_${uuid}`, // TODO: add support for storing text
      html_uuid: `html_${uuid}`,  // TODO: add support for storing html
      attachments: [],  // TODO: add support for attachments
    };

    // search the saved record for keywords
    const selectors = await getLocalItem('selectors') ?? []
    record.selectors = findMatchingValues(record.text, selectors);

    // get the existing records, append it and move on
    let screenshots = await getLocalItem('screenshots') ?? []
    // keeps records sorted by creation order
    screenshots = [record].concat(screenshots);
    await setLocalItem('screenshots', screenshots);
    // update the configuration last saved on metadata
    configurationRegistry.lastSavedOn = Date.now().toString();
    configurationRegistry.screenShotCount = screenshots.length;
    await setLocalItem('configuration', configurationRegistry);
}

/**
 * Finds all objects whose `value` field matches anywhere in the input text.
 * TODO: Normalize text and selector key to improve matching algorithm
 * @param {string} text - The text to search in.
 * @param {Array<{ key: string }>} items - The array of objects with `value` fields.
 * @returns {Array<{ match: string, index: number, ref: object }>} List of matches with references
 */
function findMatchingValues(text, selectors) {
  const matches = [];
  for (let i = 0; i < selectors.length; i++) {
    const selector = selectors[i];
    if(text.includes(selector.key)){
      matches.push(selector);
    }
  }
  return matches;
}
