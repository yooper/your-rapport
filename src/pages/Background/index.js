import { capture } from '../../datasources/browser_capture';
import {
  createTab,
  getActiveTab,
  initializeDiscoveryPlugins,
  sleep,
} from '../../utilities/loaders';
import {
  addRecord,
  getLocalItem,
  updateRecord,
} from '../../models/db/local';
import { initializeContextMenus } from '../../services/context_menu_services';
import { Selector } from '../../models/schemas/Selector';
import ExtensionPin from '../../utilities/ExtensionPin';
import { scanPage } from '../../utilities/transformers';
import { Configuration } from '../../models/schemas/Configuration';
import {
  ACTIVATE_CAPTURE,
  AUTO_COLLECT_STARTING,
  BULK_AUTOMATION,
  CAPTURE_VISIBLE_TAB, ENQUEUE_BULK_AUTOMATION_URL, PROCESS_QUEUE_AUTOMATION_URLS,
  RAPPORT,
  SELECTOR,
  START_CAPTURE,
  UUID,
} from '../../services/constants';
import { BulkAutomationUrl } from '../../models/schemas/BulkAutomationUrl';
import { getTabInfo, initializePortConnection, portManager, processReceivedMessage } from '../../utilities/PortManager';
import { debug } from '../../services/logger_services';
import { captureSingleScreenShot } from '../../services/collection_services';

/**
 * Initialize configuration values when the app is installed
 */
await initializeContextMenus();
await initializeDiscoveryPlugins();

/**
 * Global var for tracking the currently running automation
 * @type {BulkAutomationUrl}
 */
let activeAutomation = null;
initializePortConnection();


/**
 * The web page failed to load
 */
chrome.webNavigation.onErrorOccurred.addListener(async(details) => {
  const automationQueue = await getLocalItem(BULK_AUTOMATION) ?? [];
  const activeAutomation = automationQueue.find(a => a.url == details.url && a.active);
  if(!activeAutomation){
    return; // no active automation running
  }

  activeAutomation.ranOn = Date.now();
  activeAutomation.description = details.error;
  activeAutomation.completedOn = Date.now();
  activeAutomation.active = false;
  await updateRecord(BULK_AUTOMATION, UUID, activeAutomation);

  // Determines if it was a single automation request or multiple
  const bulkCollect = await Configuration.getConfigurationValue('automationBulkCollectionModel', false);
  if(!bulkCollect){
    return; // single automation request
  }

  const nextAutomation = automationQueue.find(a => !a.ranOn);
  if(!nextAutomation){
    debug('No more automations to run.');
  }
  else{
    nextAutomation.active = true;
    nextAutomation.ranOn = Date.now();
    await updateRecord(BULK_AUTOMATION, UUID, nextAutomation);
    // start the next automation
    //await createTab(activeAutomation.url);
  }
});


/**
 * Add in support for short-cut keys
 */
chrome.commands.onCommand.addListener( (command) => {
  if (command === 'reload') {
    chrome.runtime.reload();
    console.log('Run time reload');
    //createTab(chrome.runtime.getURL('search.html'), false);
    return false;
  }

  switch (command) {
    case 'initStartCapture':
        (async () => {
          await captureSingleScreenShot();
        })();
        return true;
    case 'initScanPage':
        (async () => {
          const activeTab = await getActiveTab();
          await scanPage(activeTab);
        })();
      break;
    case 'initAutoScroll':
        (async () => {
          const activeTab = await getActiveTab();
          processReceivedMessage(activeTab, {cmd: AUTO_COLLECT_STARTING});
        })();
        return false;
    default:
      debug('Unknown command');
      //response = await chrome.tabs.sendMessage(activeTab.id, { cmd: command });
      //await capture(activeTab, response);
      break;
  }
  return false;
});


/**
 * Receives messages from the content script or the extension page. Some of the incoming
 * requests will need to be mapped to the portManager
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if(message.cmd === 'initStartCapture'){
    (async () => {
      await captureSingleScreenShot();
    })();
    return false;
  }

  /**
   * Received from the content script
   */
  if(message.cmd === CAPTURE_VISIBLE_TAB){
    (async () => {
        await capture(sender.tab, message);
        sendResponse({ completed: true })
    })();
    return true;
  }

  else if(message.cmd === 'setActiveAutomation'){
    (async () => {
      activeAutomation = message.automation;
      sendResponse({ completed: true });
    })();
    return true;
  }


  (async () => {
    switch (message.cmd) {
      case 'updateScreenShotRecord':
        await updateRecord(RAPPORT, UUID, message.record);
        await Selector.findAndAssignMatches([message.record], getLocalItem(SELECTOR));
        sendResponse({ completed: true });
        break;
      case 'popupSingleCollect':
        await captureSingleScreenShot();
        sendResponse({ completed: true });
        break;
      case AUTO_COLLECT_STARTING:
        const tab = await getActiveTab();
        await chrome.tabs.sendMessage(tab.id, { cmd: ACTIVATE_CAPTURE })
        break;
      case 'indexSelector':
        await Selector.add(message.selector);
        break;
    }
  })();
  return false;
});

/**
 * Let the 'Who Am I' extension be able to RPC the extension's functionality
 */
// For a single request:
chrome.runtime.onMessageExternal.addListener(function (
  message,
  sender,
  sendResponse
) {
  if (sender.id !== 'gdnhlhadhgnhaenfcphpeakdghkccfoo') {
    return; // deny access to all extensions, except the Who Am I
  }

  try{
    switch (message.cmd) {
      case 'singleCollect':
        (async () => {
          await createTab(message.url);
          await sleep(3000);
          await captureSingleScreenShot();
        })();
        return false;
      case 'autoscrollCollect':
      case AUTO_COLLECT_STARTING:
        (async () => {
          try {
            await createTab(message.url);
            await sleep(3000);
            const activeTab = await getActiveTab();
            await chrome.tabs.sendMessage(activeTab.id, { cmd: ACTIVATE_CAPTURE })
          } catch (err) {
            console.log(err)
          }
        })();
        return false;
      case ENQUEUE_BULK_AUTOMATION_URL:
        (async () => {
          const unitDefault = await Configuration.getConfigurationValue('automationUnitDefault', 'count');
          const valueDefault = await Configuration.getConfigurationValue('automationValueDefault', 100)
          const keepTabOpenDefault = await Configuration.getConfigurationValue('automationKeepTabOpenDefault', true)
          await addRecord(BULK_AUTOMATION, UUID, {
            uuid: crypto.randomUUID(),
            url: message.url,
            createdOn: Date.now(),
            completedOn: null,
            ranOn: null,
            active: false,
            unit: unitDefault,
            value: valueDefault,
            keepTabOpen: keepTabOpenDefault,
            screenShotsCollected: 0
          });
        })();
        return false;
      default:
        console.log(`Unknown external command cmd ${message.cmd}`);
        return true;
    }
  }
  catch(e){
    ExtensionPin.setTemporaryPin('ERR')
  }
});

/**
 * On install open the github page & install default discovery plugins
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    await createTab('https://github.com/yooper/your-rapport');
  } else if (details.reason === 'update') {
    chrome.tabs.create(
      {
        url: 'https://github.com/yooper/your-rapport',
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


chrome.tabs.onCreated.addListener(tab => {
  if(tab.url && activeAutomation && tab.url === activeAutomation.url){
    debug(`automation tab created ${activeAutomation.url}`, {tab, activeAutomation})
    setTimeout(async() => {
      // TODO: put in more logic to detect stuck scraper
      if(activeAutomation.screenShotsCollected === 0){
        debug(`Active Automation url ${activeAutomation.url} is not processing, ending automation`, {tab, activeAutomation});
        return; // TODO; more debugging
        activeAutomation.description = 'Automation failed, skipping';
        activeAutomation.active = false;
        activeAutomation.completedOn = Date.now();
        await updateRecord(BULK_AUTOMATION, UUID, activeAutomation);
        activeAutomation = null; // unset the active automation
        // TODO: Working on multiple tab bug fix
        processReceivedMessage(tab, {cmd: PROCESS_QUEUE_AUTOMATION_URLS})
      }
      else{
        // success!
        debug(`automation is running correctly ${activeAutomation.url}`, activeAutomation)
      }
    }, 3000) // wait 3 seconds before failing
  }
})
