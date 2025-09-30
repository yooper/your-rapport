import { addRecord, getLocalItem, setLocalItem } from '../models/db/local';
import { Rapport } from '../models/schemas/Rapport';
import ExtensionPin from '../utilities/ExtensionPin';
import { Configuration } from '../models/schemas/Configuration';
import { RAPPORT, SELECTOR, UPDATED_ON, UUID } from '../services/constants';
import { db } from '../models/db/dexieDb';
import { debug } from '../services/logger_services';
import { Artifact } from '../models/schemas/Artifact';

/**
 * Capture the tab and persist it into local storage
 * @param tab
 * @param message
 * @param deepCapture
 * @returns {Promise<void>}
 */
export async function capture(tab, message = {}, deepCapture = false) {

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
    const selectors = await db.selector.toArray()
    const screenShot = await chrome.tabs.captureVisibleTab();
    const record = await Rapport.createFromTab(tab, text, screenShot, selectors);
    record.sequenceId = ('sequence' in message) ? message.sequence : 0;
    record.bulkAutomationUuid = ('automation' in message && message.automation) ? message.automation.uuid : null;

    // save the mhtml artifact.
    if(deepCapture){
      const blob = await chrome.pageCapture.saveAsMHTML({tabId: tab.id});
      const artifact = await Artifact.create(blob, record.uuid, tab.url, tab.title);
      db.artifact.add(artifact)
      record.artifacts.push(artifact.id)
    }

    await addRecord(RAPPORT, UUID, record);
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

// Compute SHA-256 hash of a blob
async function calculateSha256(blob){
  const buffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
