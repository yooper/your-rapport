import {addRecord, getLocalItem, setLocalItem} from "../models/db/local";
import {findAllMatches, sha256} from "../utilities/transformers";
import {Rapport} from "../models/schemas/Rapport";


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
    const record = await Rapport.createFromTab(tab, text, screenShot, selectors)

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
