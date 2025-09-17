import { addRecord, getLocalItem, setLocalItem } from '../models/db/local';
import { Rapport } from '../models/schemas/Rapport';
import ExtensionPin from '../utilities/ExtensionPin';
import { Configuration } from '../models/schemas/Configuration';
import { RAPPORT, SELECTOR, UPDATED_ON, UUID } from '../services/constants';
import { db } from '../models/db/dexieDb';

/**
 * Capture the tab and persist it into local storage
 * @param tab
 * @param message
 * @returns {Promise<void>}
 */
export async function capture(tab, message = {}) {

  ExtensionPin.setDefaultNotSaved(tab);
  let configuration = await Configuration.getConfiguration();
  // get/set the record count
  configuration.screenShotCount =
    configuration?.screenShotCount ?? 0;

  // normalize text
  const text =
    tab.title.toLowerCase() +
    ' ' +
    splitCamelCase(message?.visibleText ?? '').toLowerCase();

  try{
    // search the saved record for keywords
    const selectors = (await getLocalItem(SELECTOR)) ?? [];
    const screenShot = await chrome.tabs.captureVisibleTab();
    const record = await Rapport.createFromTab(tab, text, screenShot, selectors);

    record.sequenceId = ('sequence' in message) ? message.sequence : 0;
    record.bulkAutomationUuid = ('automation' in message && message.automation) ? message.automation.uuid : null;

    await db.rapports.add(record, record.key)
    // update the configuration last saved on metadata
    configuration[UPDATED_ON] = Date.now();
    configuration.screenShotCount++;
    await Configuration.setConfiguration(configuration)
    ExtensionPin.setDefaultSaved(tab);
  }
  catch(error){
    // TODO: ERROR handling for too many captures
    if(error){
      debug(error);
    }
    ExtensionPin.setBgColorAndText('red', 'ERR', tab);
    // stop scrolling when an error occurs
    chrome.tabs.sendMessage(tab.id, { cmd: 'stopCapture' });
  }
  finally {
    setTimeout(() => {
      ExtensionPin.setDefault(tab);
    }, 3000)
  }
}

function splitCamelCase(input) {
  return input
    .replace(/([a-z])([A-Z])/g, '$1 $2') // lower → upper: add space
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2') // split consecutive capitals like "HTMLParser" → "HTML Parser"
    .trim(); // remove leading/trailing whitespace if any
}
