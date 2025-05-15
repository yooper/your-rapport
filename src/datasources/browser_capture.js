import {addRecord, getLocalItem, setLocalItem} from "../models/db/local";
import {findAllMatches, findMatchingValues, sha256} from "../utilities/transformers";


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

    // normalize text
    const text = tab.title.toLowerCase() + ' ' + splitCamelCase(message?.text ?? '').toLowerCase();

    // search the saved record for keywords
    const selectors = await getLocalItem('selectors') ?? []

    const screenShot = await chrome.tabs.captureVisibleTab();
    const uuid = crypto.randomUUID();
    let record = {
      uuid: uuid,
      title: tab.title,
      url: tab.url,
      domain: (new URL(tab.url)).hostname,
      text: text,
      screenshot: screenShot,
      createdOn: Date.now(),
      updatedOn: Date.now(),
      createdOnLocalTime: new Date().toLocaleString(),
      hash: await sha256(screenShot),
      createdBy: 'TODO-CREATE', // TODO: add support for tracking who created the record, requires authentication
      updatedBy: 'TODO-UPDATE', // TODO: add support for tracking who updated the record, requires authentication
      length: screenShot.length,
      attributes: { tab: tab },
      selectors: findAllMatches(text, selectors, 1), // limit the search scope,
      tags: [],  // TODO: add support for tagging/annotating data
      caseManagementUuid: '30583002-f730-4383-bf28-fdd8aadcf387', // TODO: add case management functionality
      note: null
    };

    await addRecord('rapports', 'uuid', record);
    // update the configuration last saved on metadata
    configurationRegistry.lastSavedOn = Date.now().toString();
    configurationRegistry.screenShotCount++;
    await setLocalItem('configuration', configurationRegistry);
}

function splitCamelCase(input) {
    return input
        .replace(/([a-z])([A-Z])/g, '$1 $2') // lower → upper: add space
        .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2') // split consecutive capitals like "HTMLParser" → "HTML Parser"
        .trim(); // remove leading/trailing whitespace if any
}
