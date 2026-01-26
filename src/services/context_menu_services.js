import { getSelectorTypeMap } from '../utilities/loaders';
import { Configuration } from '../models/schemas/Configuration';
import ExtensionPin from '../utilities/ExtensionPin';
import {
  ACTIVATE_CAPTURE, BULK_AUTOMATION, PAGE_INFO,
  UUID,
} from './constants';
import BulkAutomationUrl from '../models/schemas/BulkAutomationUrl';
import { Selector } from '../models/schemas/Selector';
import { addRecord } from '../models/db/local';
import { getUtcNow, selectCorrectLink } from '../utilities/transformers';
import { Rapport } from '../models/schemas/Rapport';
import { fetchBlob } from './image_loading_services';
import { applyBackgroundJobs } from './discovery_plugin_services';
import { debug } from '../services/logger_services';
import { capture } from '../datasources/browser_capture';
import { waitForPageInfo } from '../backgrounds/automation-runner';
import { db } from '../models/db/dexieDb';
import { ScheduledAutomation } from '../models/schemas/ScheduledAutomation';

/**
 * Add the selectors as menu items
 * @returns {Promise<void>}
 */
export async function initializeContextMenus() {
  await chrome.contextMenus.removeAll();

  // add download image, video, audio support
  chrome.contextMenus.create({
    id: 'collectImage',
    title: 'Collect Image',
    contexts: ['image'],
  });

  // TODO: support audio and video collection

  // add capture context menu to the UI
  chrome.contextMenus.create({
    id: 'autocollectPage',
    title: 'Autoscroll Collect',
    contexts: ['page', 'image', 'video', 'audio'],
  });

  // Add right click for capturing these other types of contexts
  chrome.contextMenus.create({
    id: 'deepSave',
    title: 'Deep Save',
    contexts: ['page', 'image', 'video', 'audio'],
  });


  // add option for monitoring
  chrome.contextMenus.create({
    id: 'monitorHourly',
    title: 'Monitor (Hourly)',
    contexts: ['link', 'page'],
  });

  chrome.contextMenus.create({
    id: 'addBulkAutomationUrl',
    title: 'Add URL to Automation Queue',
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
      case 'collectImage':
        (async () => {
          ExtensionPin.setTemporaryPin('SAVG');
          const downloadedBlob = await fetchBlob(info.srcUrl);
          const rapport = await Rapport.createFromBlob(
            downloadedBlob,
            info.srcUrl,
            tab.title,
            []
          );
          rapport.sequenceId = 0;
          rapport.bulkAutomation = null;
          await Rapport.put(rapport);
          // update the configuration last saved on metadata
          let configuration = await Configuration.getConfiguration();
          // get/set the record count
          configuration.screenShotCount = configuration?.screenShotCount ?? 0;
          configuration.updatedOn = getUtcNow();
          configuration.screenShotCount++;
          await Configuration.setConfiguration(configuration);
          ExtensionPin.setDefaultSaved(tab);
        })();
        break;
      case 'deepSave':
        (async() => {
          ExtensionPin.setTemporaryPin('SAVG');
          const response = await chrome.tabs.sendMessage(tab.id, { cmd: PAGE_INFO, requestId: crypto.randomUUID() });
          const { pageInfo } = response
          await capture(tab, pageInfo, true);
        })()
        break;
      case 'autocollectPage':
        // start the autoscroll
        chrome.tabs.sendMessage(tab.id, { cmd: ACTIVATE_CAPTURE })
          .then(response => {debug(ACTIVATE_CAPTURE+':', response);})
        break;
      case 'addBulkAutomationUrl':
        (async () => {
          const urlLink = selectCorrectLink({
            linkUrl: info.linkUrl,
            frameUrl: info.frameUrl,
            pageUrl: info.pageUrl,
          });
          const record = await BulkAutomationUrl.createBulkAutomationJob(urlLink);
          await db.bulkAutomation.add(record);
          ExtensionPin.setTemporaryPin('SAVD');
        })();
        break;
      case 'monitorHourly':
        (async () => {
          const urlLink = selectCorrectLink({
            linkUrl: info.linkUrl,
            frameUrl: info.frameUrl,
            pageUrl: info.pageUrl,
          })
          await ScheduledAutomation.addMonitor(urlLink, '0 0 * * * *');
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
