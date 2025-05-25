import { capture } from '../../datasources/browser_capture';
import {
  createTab,
  getActiveTab,
  initializeDiscoveryPlugins,
  installPackage,
  sleep,
} from '../../utilities/loaders';
import {
  getLocalItem,
  setLocalItem,
  updateRecord,
} from '../../models/db/local';
import { initializeContextMenus } from '../../services/context_menu_services';
import { Selector } from '../../models/schemas/Selector';
import ExtensionPin from '../../utilities/ExtensionPin';
import { findAllMatches, scanPage } from '../../utilities/transformers';

/**
 * Initialize configuration values when the app is installed
 */
await initializeContextMenus();
await initializeDiscoveryPlugins();

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
    case 'scanPage':
      //scanPage(activeTab);
      break;
    default:
      //response = await chrome.tabs.sendMessage(activeTab.id, { cmd: command });
      //await capture(activeTab, response);
      break;
  }
  return false;
});


/**
 * Receives messages from the content script
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


  (async () => {
    switch (message.cmd) {
      case 'captureVisibleTab':
        await capture(sender.tab, message)
        sendResponse({flag: true});
        break;
      case 'bulkAutomation':
        try {
          const tab = await createTab(message.automation.url);
          await sleep(3000); // TODO: Make this a configuration value, allows for page to full load
          // forward the message to the content script
          chrome.tabs.sendMessage(tab.id, {cmd: 'startCapture', automation: message.automation}).then( response => {
            if (response.uuid === message.automation.uuid) {
              chrome.tabs.remove(tab.id);
              // sends the response back to the extension page that made the request
              sendResponse({ uuid: message.automation.uuid });
            }
          })
        } catch (err) {
          console.log(err)
          sendResponse({ uuid: message.automation.uuid, error: err.message });
        }
        break;
      case 'updateScreenShotRecord':
        await updateRecord('rapports', 'uuid', message.record);
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
chrome.runtime.onMessageExternal.addListener(async function (
  message,
  sender,
  sendResponse
) {
  if (sender.id !== 'gdnhlhadhgnhaenfcphpeakdghkccfoo') {
    return; // deny access to all extensions, except the Who Am I
  }

  switch (message.cmd) {
    case 'singleCollect':
      await createTab(message.url);
      await sleep(2000);
      const singleTabCapture = await getActiveTab();
      await capture(singleTabCapture, message);
      return true;
    case 'autoscrollCollect':
      await createTab(message.url);
      await sleep(2000);
      const tab = await getActiveTab();
      await chrome.tabs.sendMessage(tab.id, { cmd: 'startCapture' });
      return true;
    default:
      console.log(`Unknown cmd ${message.cmd}`);
      return true;
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
