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
  ENQUEUE_BULK_AUTOMATION_URL, PAGE_INFO, UUID, AUTO_COLLECT_SCROLLBAR_STOPPED,
} from '../../services/constants';

import { debug } from '../../services/logger_services';
import { JobQueue } from '../../models/schemas/JobQueue';
import { initializeAutomationRunner } from '../../backgrounds/automation-runner';
import { fetchPackages } from '../../models/schemas/Package';
import { db } from '../../models/db/dexieDb';
import { Rapport } from '../../models/schemas/Rapport';
import { ScheduledAutomation } from '../../models/schemas/ScheduledAutomation';
import { getActivePageInfo } from '../Content/scripts/pageInfo';
import { requestAllSitesAccess } from '../../services/manifest_permissions';

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

let _session = null;

export function getSession(){

}

/**
 * Add in support for short-cut keys
 */
let _commandLock = false;

chrome.commands.onCommand.addListener(async(command) => {

  if(_commandLock){
    debug('Command lock on', {command});
    return;
  }
  _commandLock = true
  // resolves multiple commands sent via keyboard
  setTimeout(() => _commandLock = false, 750);

  // This has to be done this way because of way Chrome determines gestures correctly
  if(command === 'initScanPage'){
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.sidePanel.open({ tabId: tabs[0].id })
    })
    return;
  }
  await debug(`Command ${command} received`)
  const activeTab = await getActiveTab()
  const pageInfo = await getActivePageInfo(activeTab);
  
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

  else if(message.cmd === 'installGemini'){

  }

  else if (message.cmd === 'remoteDebug'){
    (async () => {
      await debug(message.message, message.data, false);
      sendResponse({ completed: true });
    })();
    return true;
  }

  else if (message.cmd === 'slidePanelInit'){
    (async () => {
      try {
        const activeTab = await getActiveTab();
        const pageInfo = await getActivePageInfo(activeTab);
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
      const pageInfo = await getActivePageInfo(activeTab);
      ExtensionPin.setDefaultNotSaved(activeTab);
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

  else if(message.cmd === AUTO_COLLECT_SCROLLBAR_STOPPED){
    (async () => {
      sendResponse({ completed: true });
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
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  debug('onMessageExternal:start', {message, sender});

  let hasPermission = false;
  try {
    (async () => {
      switch (message.cmd) {
        case 'deepSave':
          hasPermission = await requestAllSitesAccess()
          if(!hasPermission){
            sendResponse({completed: false, message: 'You must accept the permissions change in order to enable this automation.'})
            break;
          }
          await createTab(message.url);
          const activeTab = await getActiveTab();
          // wait for page contents to load
          await sleep(3000);
          const pageInfo = await getActivePageInfo(activeTab);
          // TODO: make this configurable or dynamic based on the domain
          await capture(activeTab, pageInfo, true);
          sendResponse({completed: true})
          try{
            await chrome.tabs.remove(activeTab.id);
          }
          catch(error){
            // could not close the tab
          }
          break;
        case AUTO_COLLECT_STARTING:
          hasPermission = await requestAllSitesAccess()
          if(!hasPermission){
            sendResponse({completed: false, message: 'You must accept the permissions change in order to enable this automation.'})
            break;
          }
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
          hasPermission = await requestAllSitesAccess()
          if(!hasPermission){
            sendResponse({completed: false, message: 'You must accept the permissions change in order to enable this automation.'})
            break;
          }
          const record = await BulkAutomationUrl.createBulkAutomationJob(message.url);
          await db.bulkAutomation.add(record);
          break;
        case 'ping':
          sendResponse({completed: true});
          break;
        case 'monitorHourly':
          hasPermission = await requestAllSitesAccess()
          if(!hasPermission){
            sendResponse({completed: false, message: 'You must accept the permissions change in order to enable this automation.'})
            break;
          }
          await ScheduledAutomation.addMonitor(message.url, '0 0 * * * *');
          sendResponse({completed: true})
          break;
        default:
          return false;
      }
    })()
    return false;
  } catch (e) {
    debug('onMessageExternal:failure', { message, sender, e })
  }
})

/**
 * When the web page changes, we need to reset the extension pin to its default state
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // when the tab changes, check if it changes to an extension page and close the side panel
  if(tab.url.startsWith(`chrome://extensions/?id=${chrome.runtime.id}`)){
    let gettingContextInfo = chrome.runtime.getContexts({ contextTypes: ['SIDE_PANEL']});
    gettingContextInfo.then(contexts => {
      contexts.forEach(c => {
        if(c.tagId == tabId){
          chrome.sidePanel.close({tabId})
        }
      })
    })
  }

  if (changeInfo.status === 'complete') {
    // TODO: Fix bug with autocompleting, can cause loop that requires disabling the extension to exit out.
    ExtensionPin.setDefault(tab);
  }
});
