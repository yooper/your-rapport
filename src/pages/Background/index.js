import { capture } from '../../datasources/browser_capture';
import {
  createTab,
  getActiveTab,
  initializeDiscoveryPlugins,
  sleep,
} from '../../utilities/loaders';
import BulkAutomationUrl from '../../models/schemas/BulkAutomationUrl'
import { initializeContextMenus } from '../../services/context_menu_services';
import ExtensionPin from '../../utilities/ExtensionPin';
import { scanPage } from '../../utilities/transformers';
import { Configuration } from '../../models/schemas/Configuration';
import {
  ACTIVATE_CAPTURE,
  AUTO_COLLECT_STARTING,
  BULK_AUTOMATION,
  CAPTURE_VISIBLE_TAB,
  ENQUEUE_BULK_AUTOMATION_URL, PAGE_INFO, UUID,
} from '../../services/constants';

import { debug } from '../../services/logger_services';


import { JobQueue } from '../../models/schemas/JobQueue';

import { initializeAutomationRunner } from '../../backgrounds/automation-runner';
import { addRecord } from '../../models/db/local';

/**
 * Initialize services when the extension is installed / activated
 */
await initializeContextMenus();
await initializeDiscoveryPlugins();
initializeAutomationRunner();


let _jobQueue = null;
export function getJobQueue(){
  if(!_jobQueue){
    _jobQueue = new JobQueue(2);
  }
  return _jobQueue
}

/**
 * Add in support for short-cut keys
 */
chrome.commands.onCommand.addListener(async(command) => {
  debug(`Command ${command} received`)

  const activeTab = await getActiveTab()
  const response = await chrome.tabs.sendMessage(activeTab.id, { cmd: PAGE_INFO });
  const { pageInfo } = response

  switch (command) {
    case 'deepSave':
      await capture(activeTab, pageInfo, true);
      return true;
      break;
    case 'initScanPage':
      await scanPage(activeTab)
      break;
    case 'initAutoScroll':
      chrome.tabs.sendMessage(activeTab.id, { cmd: ACTIVATE_CAPTURE })
        .then(response => {debug(ACTIVATE_CAPTURE+':', response);
        })
      return true;
      break;
    default:
      break;
  }
});

/**
 * This functions as the public api that other parts of the app message with
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.cmd === 'deepSave') {
    (async () => {
      const response = await chrome.tabs.sendMessage(sender.tab.id, { cmd: PAGE_INFO });
      const { pageInfo } = response
      await capture(sender.tab, pageInfo, true);
      sendResponse({completed: true, deepSave: true, pageInfo})
    })();
    return true;
  }
  /**
   * Tell the content script the save was successful
   */
  if (message.cmd === CAPTURE_VISIBLE_TAB) {
    (async () => {
      await capture(sender.tab, message.pageInfo, message.pageInfo.automation?.isDeepSave ?? false);
      sendResponse({ completed: true });
    })();
    return true;
  }
});

/**
 * Let the 'Who Am I' extension be able to RPC the extension's functionality
 */
// For a single request:
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  debug('onMessageExternal', {message, sender});

  try {
    (async () => {
      switch (message.cmd) {
        case 'singleCollect':
        case 'deepSave':
          await createTab(message.url);
          const activateTab = await getActiveTab();
          await sleep(3000);
          const response = await chrome.tabs.sendMessage(activateTab.id, { cmd: PAGE_INFO });
          const { pageInfo } = response
          // wait for page contents to load
          // TODO: make this configurable or dynamic based on the domain
          await capture(activateTab, pageInfo, true);
          sendResponse({completed: true})
          break;
        case AUTO_COLLECT_STARTING:
        case 'autoscrollCollect':
          await createTab(message.url);
          await sleep(3000);
          sendResponse({completed: true})
          chrome.tabs.sendMessage((await getActiveTab()).id, { cmd: ACTIVATE_CAPTURE })
            .then(response => {
              debug(ACTIVATE_CAPTURE + ':', response);
            })
          break;
        case ENQUEUE_BULK_AUTOMATION_URL:
        case 'enqueueBulkAutomation':
          const unitDefault = await Configuration.getConfigurationValue(
            'automationUnitDefault',
            'count'
          );
          const valueDefault = await Configuration.getConfigurationValue(
            'automationValueDefault',
            100
          );
          const record = await BulkAutomationUrl.createBulkAutomationJob(message.url, unitDefault, valueDefault);
          await addRecord(BULK_AUTOMATION, UUID, record);
          break;
        case 'ping':
          sendResponse({completed: true});
        default:
          return false;
      }
    })()
    return false;
  } catch (e) {

    debug('onMessageExternal:failure', { message, sender })
  }
})



/**
 * On install open the github page & install default discovery plugins
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    await createTab('https://github.com/yooper/your-rapport/wiki');
  } else if (details.reason === 'update') {
    chrome.tabs.create(
      {
        url: 'https://github.com/yooper/your-rapport/wiki',
      },
      (tab) => {}
    );
    // When extension is updated
  } else if (details.reason === 'chrome_update') {
    // When browser is updated
  } else if (details.reason === 'shared_module_update') {
    // When a shared module is updated
  }
});

/**
 * When the web page changes, we need to reset the extension pin to its default state
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    // TODO: Fix bug with autocompleting, can cause loop that requires disabling the extension to exit out.
    ExtensionPin.setDefault(tab);
  }
});
