import {getLocalItem, setLocalItem} from "../models/db/local";
import {sha256} from "../utilities/transformers";
import {createTab} from "../utilities/loaders";


/**
 * Capture the tab and persist it into local storage
 * @param tab
 * @param message
 * @returns {Promise<void>}
 */
export async function capture(tab, message = {}){

    let configurationRegistry = await getLocalItem('configuration') ?? { authToken: false, productVersion: 'trial'};
    const isAuthenticated = configurationRegistry.authToken ?? false;
    const isProVersion = configurationRegistry.productVersion === 'pro';
    // get/set the record count
    configurationRegistry.recordCount = configurationRegistry?.recordCount ?? 0
    // You must be authenticated to use the capture feature for over 200 captures.
    if(!isAuthenticated && configurationRegistry.recordCount >= 200){
        await createTab('https://osintliar.com/your-rapport-authentication-error/', true);
        throw new Error("You MUST register if you want to collect more than 100 captures.");
    }
    if(isAuthenticated && configurationRegistry.recordCount >= 400 && !isProVersion){
        await createTab('https://osintliar.com/pro-license-required/', true);
        throw new Error("You MUST register and have the PRO paid version if you want to collect more than 400 captures.");
    }

    const screenShot = await chrome.tabs.captureVisibleTab();
    let record = {
      uuid: crypto.randomUUID(),
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
      caseManagementUuid: '30583002-f730-4383-bf28-fdd8aadcf387' // TODO: add case management functionality
    };
    // get the existing records, append it and move on
    let screenshotRegistry = await getLocalItem('screenshots') ?? {}

    let records = screenshotRegistry?.records ?? [];
    // keeps records sorted by creation order
    screenshotRegistry.records = [record].concat(records);
    await setLocalItem('screenshots', screenshotRegistry);

    // update the configuration last
    configurationRegistry.lastSavedOn = Date.now().toString();
    configurationRegistry.recordCount = screenshotRegistry.records.length;
    await setLocalItem('configuration', configurationRegistry);
}
