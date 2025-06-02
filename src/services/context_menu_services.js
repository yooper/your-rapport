import { capture } from '../datasources/browser_capture';
import { Selector } from '../models/schemas/Selector';
import { getActiveTab, getSelectorTypeMap } from '../utilities/loaders';
import { Configuration } from '../models/schemas/Configuration';
import { addRecord } from '../models/db/local';
import ExtensionPin from '../utilities/ExtensionPin';
import { BULK_AUTOMATION, UUID } from './constants';

/**
 * Add the selectors as menu items
 * @returns {Promise<void>}
 */
export async function initializeContextMenus() {
  await chrome.contextMenus.removeAll();

  // add capture context menu to the UI
  chrome.contextMenus.create({
    id: 'autocollectPage',
    title: 'Autoscroll Collect',
    contexts: ['page'],
  });

  // add link to bulk capture for future research
  chrome.contextMenus.create({
    id: 'addBulkAutomationUrl',
    title: 'Add url to Automation Queue',
    contexts: ['link'],
  });

  // add a seperator
  chrome.contextMenus.create({
    type: 'separator',
    id: 'separator_1',
    contexts: ['selection'],
  });
  for (const [key, label] of Object.entries(getSelectorTypeMap())) {
    chrome.contextMenus.create({
      title: `Capture text as a ${label}`,
      id: key,
      contexts: ['selection'],
      type: 'normal',
    });
  }
  // add event listeners
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
      case 'autocollectPage':
        (async () => {
          chrome.tabs.sendMessage(tab.id, { cmd: 'startCapture' });
        })();
        return false;
      case 'addBulkAutomationUrl':
        (async () => {
          const unitDefault = await Configuration.getConfigurationValue('automationUnitDefault', 'count');
          const valueDefault = await Configuration.getConfigurationValue('automationValueDefault', 100)
          const keepTabOpenDefault = await Configuration.getConfigurationValue('automationKeepTabOpenDefault', true)
          await addRecord(BULK_AUTOMATION, UUID, {
            uuid: crypto.randomUUID(),
            url: info.linkUrl,
            createdOn: Date.now(),
            completedOn: null,
            ranOn: null,
            unit: unitDefault,
            value: valueDefault,
            keepTabOpen: keepTabOpenDefault,
            screenShotsCollected: 0
          });
          ExtensionPin.setTemporaryPin('SAVD');
        })();
        break;
      default:
        const selectorTypeName = info.menuItemId;
        const key = info.selectionText;
        Selector.add(new Selector(key, selectorTypeName)).then()
        ExtensionPin.setTemporaryPin('SAVD');
        break;
    }
  });
}
