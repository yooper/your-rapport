import { capture } from '../../datasources/browser_capture';
import {
  createTab,
  getActiveTab,
  sleep,
} from '../../utilities/loaders';
import BulkAutomationUrl from '../../models/schemas/BulkAutomationUrl'
import { initializeContextMenus } from '../../services/context_menu_services';
import ExtensionPin from '../../utilities/ExtensionPin';
import {
  ACTIVATE_CAPTURE,
  AUTO_COLLECT_STARTING,
  BULK_AUTOMATION,
  CAPTURE_VISIBLE_TAB,
  NO_VISIBLE_TEXT,
  ENQUEUE_BULK_AUTOMATION_URL, PAGE_INFO, UUID,
} from '../../services/constants';

import { debug } from '../../services/logger_services';


import { JobQueue } from '../../models/schemas/JobQueue';

import { initializeAutomationRunner } from '../../backgrounds/automation-runner';
import { fetchPackages } from '../../models/schemas/Package';
import { db } from '../../models/db/dexieDb';
import { Rapport } from '../../models/schemas/Rapport';
import { ScheduledAutomation } from '../../models/schemas/ScheduledAutomation';

/**
 * Initialize services when the extension is installed / activated
 */
await initializeContextMenus();
initializeAutomationRunner();
// Upon startup update or install discovery plugins
await fetchPackages();

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
  // This has to be done this way because of way Chrome determines gestures correctly
  if(command === 'initScanPage'){
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.sidePanel.open({ tabId: tabs[0].id })
    })
    return;
  }

  await debug(`Command ${command} received`)
  const activeTab = await getActiveTab()
  const response = await chrome.tabs.sendMessage(activeTab.id, { cmd: PAGE_INFO, requestId: crypto.randomUUID() });
  const { pageInfo } = response

  switch (command) {
    case 'deepSave':
      await capture(activeTab, pageInfo, true);
      break;
    case 'initAutoScroll':
      const response = chrome.tabs.sendMessage(activeTab.id, { cmd: ACTIVATE_CAPTURE, requestId: crypto.randomUUID() })
      await debug('init auto scroll', response)
      break;
    case 'openDashboard':
      await createTab(`chrome-extension://${chrome.runtime.id}/search.html`);
      break;
    default:
      debug('Unknown command ' + command)
      break;
  }
});

/**
 * This functions as the public api that other parts of the app message with
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if(message.cmd === 'quickScan'){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.sidePanel.open({ tabId: tabs[0].id })
    })
    return false;
  }
  else if (message.cmd === 'slidePanelInit'){
    (async () => {
      try {
        const activeTab = await getActiveTab();
        const { pageInfo } = await chrome.tabs.sendMessage(activeTab.id, { cmd: 'PAGE_INFO', requestId: crypto.randomUUID() });
        sendResponse(pageInfo);
      } catch (e) {
        debug(String(e) + ' Slide Panel error');
      }
    })();
    return true;
  }
  else if (message.cmd === 'deepSave') {
  (async () => {
    try {
      const activeTab = await getActiveTab();
      ExtensionPin.setDefaultNotSaved(activeTab);
      const { pageInfo } = await chrome.tabs.sendMessage(activeTab.id, { cmd: 'PAGE_INFO', requestId: crypto.randomUUID() });
      await capture(activeTab, pageInfo, true);
      sendResponse({ completed: true, deepSave: true, pageInfo });
      ExtensionPin.setDefaultSaved(activeTab);
    }
    catch (e)
    {
      await debug('deep save failed.')
      ExtensionPin.setTempErrorPin(message, sender.tab);
      sendResponse({
        completed: false,
        deepSave: true,
        error: e instanceof Error ? e.message : String(e)
      });
    }
  })();
    return true;
  }
  else if(message.cmd === AUTO_COLLECT_STARTING) {
    (async () => {
      const tab = await getActiveTab();
      await chrome.tabs.sendMessage(tab.id, { cmd: ACTIVATE_CAPTURE, requestId: crypto.randomUUID() })
      sendResponse({ completed: true, deepSave: false });
    })();
    return true;
  }
  else if(message.cmd === 'sync'){
    (async () => {
      const rapport = await db.rapport.get(message.uuid);
      if(rapport){
        Rapport.sync(rapport);
      }
      sendResponse({ completed: true});
    })();
    return true;
  }

  /**
   * Used by the authentication process
   */
  else if (message.cmd === 'createTab'){
    (async () => {
      await createTab(message.url);
      sendResponse({ completed: true });
    })();
    return true;
  }


  /**
   * Tell the content script the save was successful
   */
  else if (message.cmd === CAPTURE_VISIBLE_TAB) {
    (async () => {
      await capture(sender.tab, message.pageInfo, message.pageInfo.automation?.isDeepSave ?? false, message.pageInfo.automation ?? null);
      // update the screenshot count
      if(message.pageInfo.automation){
        const automation = message.pageInfo.automation;
        const record = await db.bulkAutomation.get(automation.uuid);
        record.screenShotsCollected = message.pageInfo.sequence;
        await db.bulkAutomation.put(record);
      }
      sendResponse({ completed: true });
    })();
    return true;
  }
  // TODO: Add better error handling
  else if (message.cmd === NO_VISIBLE_TEXT) {
    (async () => {
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
        case 'singleCollect': // TODO: Deprecated remove after 1/1/26
        case 'deepSave':
          await createTab(message.url);
          const activateTab = await getActiveTab();
          await sleep(3000);
          const response = await chrome.tabs.sendMessage(activateTab.id, { cmd: PAGE_INFO, requestId: crypto.randomUUID() });
          const { pageInfo } = response
          // wait for page contents to load
          // TODO: make this configurable or dynamic based on the domain
          await capture(activateTab, pageInfo, true);
          sendResponse({completed: true})
          break;
        case AUTO_COLLECT_STARTING:
        case 'autoscrollCollect': // TODO: Deprecated remove after 1/1/26
          await createTab(message.url);
          await sleep(3000);
          sendResponse({completed: true})
          chrome.tabs.sendMessage((await getActiveTab()).id, { cmd: ACTIVATE_CAPTURE, requestId: crypto.randomUUID() })
            .then(response => {
              debug(ACTIVATE_CAPTURE + ':', response);
            })
          break;
        case ENQUEUE_BULK_AUTOMATION_URL:
        case 'enqueueBulkAutomation':
          const record = await BulkAutomationUrl.createBulkAutomationJob(message.url);
          await db.bulkAutomation.add(record);
          break;
        case 'ping':
          sendResponse({completed: true});
          break;
        case 'monitorHourly':
          await ScheduledAutomation.addMonitor(message.url, '0 0 * * * *');
          break;
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
 * When the web page changes, we need to reset the extension pin to its default state
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // when the tab changes, check if it changes to an extension page and close the side panel
  if(tab.url.startsWith(`chrome://extensions/?id=${chrome.runtime.id}`)){
    chrome.sidePanel.close({tabId})
  }

  if (changeInfo.status === 'complete') {
    // TODO: Fix bug with autocompleting, can cause loop that requires disabling the extension to exit out.
    ExtensionPin.setDefault(tab);
  }
});
