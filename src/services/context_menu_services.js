import { getSelectorTypeMap } from '../utilities/loaders';
import { Configuration } from '../models/schemas/Configuration';
import ExtensionPin from '../utilities/ExtensionPin';
import { ACTIVATE_CAPTURE, BULK_AUTOMATION, UUID } from './constants';
import { captureSingleScreenShot } from './collection_services';
import { db } from '../models/db/dexieDb';
import { BulkAutomationUrl } from '../models/schemas/BulkAutomationUrl';
import { Selector } from '../models/schemas/Selector';

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
    contexts: ['page', 'image','video','audio'],
  });

  // add link to bulk capture for future research
  chrome.contextMenus.create({
    id: 'addBulkAutomationUrl',
    title: 'Add url to Automation Queue',
    contexts: ['link'],
  });

  // Add right click for capturing these other types of contexts
  chrome.contextMenus.create({
    id: 'singleCollect',
    title: 'Single Collect',
    contexts: ['image','video','audio'],
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
      case 'singleCollect':
        ExtensionPin.setTemporaryPin('SAVG')
        captureSingleScreenShot(true).then()
        break;
      case 'autocollectPage':
        captureSingleScreenShot().then(() => {
          ExtensionPin.setTemporaryPin('SAVG')
          chrome.tabs.sendMessage(tab.id, { cmd: ACTIVATE_CAPTURE })
        })
        break;
      case 'addBulkAutomationUrl':
        (async () => {
          const unitDefault = await Configuration.getConfigurationValue('automationUnitDefault', 'count');
          const valueDefault = await Configuration.getConfigurationValue('automationValueDefault', 100)
          const keepTabOpenDefault = await Configuration.getConfigurationValue('automationKeepTabOpenDefault', true)
          await db.bulkAutomation.add(new BulkAutomationUrl({
            url: info.linkUrl,
            createdOn: Date.now(),
            completedOn: null,
            ranOn: null,
            unit: unitDefault,
            value: valueDefault,
            keepTabOpen: keepTabOpenDefault,
            screenShotsCollected: 0
          })
          )
          ExtensionPin.setTemporaryPin('SAVD');
        })();
        break;
      default:
        const selectorTypeName = info.menuItemId;
        const value = info.selectionText;
        Selector.add(new Selector(value, new String(selectorTypeName)));
        ExtensionPin.setTemporaryPin('SAVD');
        break;
    }
  });
}
