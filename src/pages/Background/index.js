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

/**
 * Initialize configuration values when the app is installed
 */
await initializeContextMenus();
await initializeDiscoveryPlugins();


chrome.runtime.onConnect.addListener((port) => {
  console.assert(port.name === RAPPORT);
  if(port.name !== RAPPORT){
    console.log('Cannot process ' + port.name);
    return;
  }

  // TODO: Upon connection initialize automation setup
  if (port.sender?.tab) {
    const tab = port.sender.tab;
    console.log("Connected from tab:", tab.id, tab.url);
  } else {
    console.log("No tab associated with this port. Ignoring message");
    return;
  }

  // TODO: receive messages and route them
  port.onMessage.addListener((message) => {
    if (port.sender?.tab) {
      const tab = port.sender.tab;
      console.log("Received message from tab:", tab.id, tab.url);
      port.postMessage({question: "I don't get it."});
    } else {
      console.log("No tab associated with this port. Ignoring message");
      return;
    }

  });
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
  else if(message.cmd === 'bulkAutomationUrl'){
    (async () => {
      try {
        // prevent previous automations from re-running
        if(message.automation?.ranOn){
          return;
        }

        await createTab(message.automation.url);
        await sleep( await Configuration.getConfigurationValue('automationDelayOpenTabDefault', 3000)); // TODO: Make this a configuration value, allows for page to full load
        message.automation.ranOn = Date.now();
        await updateRecord(BULK_AUTOMATION, UUID, message.automation);
        // forward the message to the content script
        const activeTab = await getActiveTab();
        // verify messages can be sent to the tab
        chrome.tabs.sendMessage(activeTab.id, {cmd: 'ping'}).then(response => {
          chrome.tabs.sendMessage(activeTab.id, {cmd: 'startCapture', automation: message.automation})
        }).catch(error => {
          // the tab is not a web page that can be processed, could be a bad url
          message.automation.completedOn = Date.now();
          message.automation.description = "Failed to run automation " + error.message
          updateRecord(BULK_AUTOMATION, UUID, message.automation);
          // TODO: call next automation
        });
      }
      catch (err) {
        console.log(err);
        // the tab is not a web page that can be processed, could be a bad url
        message.automation.completedOn = Date.now();
        message.automation.description = "Failed to run automation " + err.message
        updateRecord(BULK_AUTOMATION, UUID, message.automation);
        // TODO: call next automation
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
        chrome.tabs.sendMessage(activeTab.id, {cmd: 'ping'}).then(response => {
          chrome.tabs.sendMessage(activeTab.id, {cmd: 'startCapture', automation: message.automation})
        }).catch(error => {
          // the tab is not a web page that can be processed, could be a bad url
          nextAutomation.completedOn = Date.now();
          nextAutomation.description = "Failed to run automation " + error.message
          updateRecord(BULK_AUTOMATION, UUID, nextAutomation);
        });
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
