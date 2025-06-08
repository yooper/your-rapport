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
import { BULK_AUTOMATION, RAPPORT, SELECTOR, UUID } from '../../services/constants';
import { BulkAutomationUrl } from '../../models/schemas/BulkAutomationUrl';

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

/**
 * The page failed to load
 */
chrome.webNavigation.onErrorOccurred.addListener(async(details) => {
  // an error occurred, unset the active automation
  if(details.url === activeAutomation.url &&
    (!activeAutomation.completedOn || activeAutomation.screenShotsCollected >= 0)){
    activeAutomation.ranOn =  activeAutomation.ranOn ?? Date.now();
    activeAutomation.description = details.error;
    activeAutomation.completedOn = Date.now();
    await updateRecord(BULK_AUTOMATION, UUID, activeAutomation);
    activeAutomation = null;

    // invoke next automation when tab fails to load
    const automations = await getLocalItem(BULK_AUTOMATION) ?? [];
    const found = automations.find(a => !a.ranOn);

    if(!found){
      console.log('No automations to run');
    }
    else{
      activeAutomation = found;
      await createTab(activeAutomation.url);
      console.log(`Initializing automation ${activeAutomation.url}`);
    }
  }
});

/**
 * After the page has successful loaded initialize the capture
 */
chrome.webNavigation.onCompleted.addListener(async(details) => {
  // an error occurred, unset the active automation
  if(details.url === activeAutomation.url && !activeAutomation.completedOn){
    await sleep(3000);
    activeAutomation.ranOn = Date.now();
    await updateRecord(BULK_AUTOMATION, UUID, activeAutomation);
    await chrome.tabs.sendMessage(details.tabId, {cmd: 'startCapture', automation: activeAutomation})
  }
});


/**
 * Add in support for short-cut keys
 */
chrome.commands.onCommand.addListener( (command) => {
  if (command === 'openDashboard') {
    createTab(chrome.runtime.getURL('search.html'), false);
    return false;
  }

  switch (command) {
    case 'initStartCapture':
        (async () => {
          const activeTab = await getActiveTab();
          const response = await chrome.tabs.sendMessage(activeTab.id, { cmd: 'getVisibleText' });
          await capture(activeTab, response);
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
          chrome.tabs.sendMessage(activeTab.id, { cmd: 'startCapture' });
        })();
        return false;
    default:
      //response = await chrome.tabs.sendMessage(activeTab.id, { cmd: command });
      //await capture(activeTab, response);
      break;
  }
  return false;
});


/**
 * Receives messages from the content script or the extension page
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if(message.cmd === 'initStartCapture'){
    (async () => {
      const activeTab = await getActiveTab();
      const response = await chrome.tabs.sendMessage(activeTab.id, { cmd: 'getVisibleText' });
      await capture(activeTab, response);
    })();
    return false;
  }
  if(message.cmd === 'captureVisibleTab'){
    (async () => {
        await capture(sender.tab, message);
        sendResponse({ completed: true })
    })();
    return true;
  }
  else if(message.cmd === 'queueAutomationUrl'){
    (async () => {

      const automations = await getLocalItem(BULK_AUTOMATION) ?? [];
      const found = automations.find(a => !a.ranOn);

      if(!found){
        console.log('No automations to run');
        activeAutomation = null;
      }
      // the active is already set to
      if(found.uuid === activeAutomation?.uuid ?? null){
        console.log(`Automation Url is active ${activeAutomation.url}`);
      }
      else{
        activeAutomation = found;
        await createTab(activeAutomation.url);
        console.log(`Initializing automation ${activeAutomation.url}`);
      }

    })();
    return false;
  }
  else if(message.cmd === 'bulkCollectionComplete'){
    (async () => {
      try {
        if(!message.automation.keepTabOpen){
          await chrome.tabs.remove(sender.tab.id);
        }
        /* @BulkAutomationUrl */
        let automation = message.automation;
        // update the record
        await updateRecord(BULK_AUTOMATION, UUID, automation);
        const automations = await getLocalItem(BULK_AUTOMATION);
        let nextAutomation = automations.find(a => !a.ranOn);

        if(!nextAutomation){
          // stop processing requests, nothing left to process
          return;
        }

        // TODO: There is a bug when you run a single bulk automation, it will run the other ones too
        // kick off next automation
        await createTab(nextAutomation.url);
        await sleep(3000); // TODO: Make this a configuration value, allows for page to full load
        nextAutomation.ranOn = Date.now();
        await updateRecord(BULK_AUTOMATION, UUID, nextAutomation);
        // forward the message to the content script
        const activeTab = await getActiveTab();
        // verify messages can be sent to the tab
        chrome.tabs.sendMessage(activeTab.id, {cmd: 'startCapture', automation: nextAutomation})
      }
      catch (err) {
        console.log(err)
      }
    })();
    return false;
  }

  (async () => {
    switch (message.cmd) {
      case 'updateScreenShotRecord':
        await updateRecord(RAPPORT, UUID, message.record);
        await Selector.findAndAssignMatches([message.record], getLocalItem(SELECTOR));
        sendResponse({ completed: true });
        break;
      case 'popupSingleCollect':
        const activeTab = await getActiveTab();
        const response = await chrome.tabs.sendMessage(activeTab.id, {
          cmd: 'getVisibleText',
        });
        await capture(activeTab, response);
        sendResponse({ completed: true });
        break;
      case 'autoscrollCollect':
        const tab = await getActiveTab();
        await chrome.tabs.sendMessage(tab.id, { cmd: 'startCapture' });
        break;
      case 'indexSelector':
        await Selector.add(message.selector);
        break;
    }
  })();
  return message.cmd !== 'bulkAutomation';
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
          const activeTab = await getActiveTab();
          const response = await chrome.tabs.sendMessage(activeTab.id, { cmd: 'getVisibleText' });
          await capture(activeTab, response);
        })();
        return false;
      case 'autoscrollCollect':
        (async () => {
          try {
            await createTab(message.url);
            await sleep(3000);
            const activeTab = await getActiveTab();
            await chrome.tabs.sendMessage(activeTab.id, { cmd: 'startCapture' })
          } catch (err) {
            console.log(err)
          }
        })();
        return false;
      case 'enqueueBulkAutomation':
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
    ExtensionPin.setDefault(tab);
  }
});
