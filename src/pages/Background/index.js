import {capture} from "../../datasources/browser_capture";
import {
    createTab,
    getActiveTab,
    initializeDiscoveryPlugins,
    installPackage,
    sleep
} from "../../utilities/loaders";
import {getLocalItem, setLocalItem, updateRecord} from "../../models/db/local";
import {initializeContextMenus} from "../../services/context_menu_services";
import {Selector} from "../../models/schemas/Selector";
import ExtensionPin from "../../utilities/ExtensionPin";
import {findAllMatches} from "../../utilities/transformers";


/**
 * Initialize configuration values when the app is installed
 */
await initializeContextMenus();
await initializeDiscoveryPlugins();

/**
 * Add in support for short-cut keys
 */
chrome.commands.onCommand.addListener(async(command) => {

    if(command === 'openDashboard'){
        await createTab(chrome.runtime.getURL('search.html'), false);
        return;
    }

    const activeTab = await getActiveTab();
    let response = null;
    switch(command){
        case 'singleCapture':
            response = await chrome.tabs.sendMessage(activeTab.id, {cmd: 'getVisibleText'});
            await capture(activeTab, response);
            break;
        case 'scanPage':
            //ExtensionPin.scanPage(activeTab.id);
            response = await chrome.tabs.sendMessage(activeTab.id, {cmd: 'getFullText'});
            const selectors = findAllMatches(response.text, await getLocalItem('selectors'))
            // after the scan is done
            ExtensionPin.showNumber(selectors.length, activeTab.id);
            chrome.tabs.sendMessage(activeTab.id, {cmd: 'markText', selectors: selectors }).then(() => {});
            break;
        default:
            response = await chrome.tabs.sendMessage(activeTab.id, {cmd: command});
            await capture(activeTab, response);
            break;
    }
});


/**
 * Receives messages from the content script
 */
chrome.runtime.onMessage.addListener( async(message, sender, sendResponse) => {
    switch(message.cmd){
        case 'captureVisibleTab':
            await capture(sender.tab, message)
            sendResponse({flag: true});
            return true;
        case 'updateScreenShotRecord':
            await updateRecord('rapports', 'uuid', message.record);
            sendResponse({completed: true});
            return true;
        case 'popupSingleCollect':
            const activeTab = await getActiveTab();
            const response = await chrome.tabs.sendMessage(activeTab.id, {cmd: 'getVisibleText'});
            await capture(activeTab, response);
            sendResponse({completed: true});
            return true;
        case 'autoscrollCollect':
            const tab = await getActiveTab();
            await chrome.tabs.sendMessage(tab.id, {cmd: 'startCapture'});
            return true;
        case 'indexSelector':
            await Selector.add(message.selector);
            return true;
        case 'scanText': // originates from the content script
            return true;
        default:
            console.log(`Unknown cmd ${message.cmd}`);
            return true;
    }
});

/**
 * Let the 'Who Am I' extension be able to RPC the extension's functionality
*/
// For a single request:
chrome.runtime.onMessageExternal.addListener(
  async function(message, sender, sendResponse) {
    if (sender.id !== 'gdnhlhadhgnhaenfcphpeakdghkccfoo') {
        return;  // deny access to all extensions, except the Who Am I
    }

    switch(message.cmd){
        case 'singleCollect':
            await createTab(message.url);
            await sleep(1000)
            const singleTabCapture = await getActiveTab();
            await capture(singleTabCapture, message)
            return true;
        case 'autoscrollCollect':
            // TODO: not working
            await createTab(message.url);
            await sleep(1000)
            const tab = await getActiveTab();
            await chrome.tabs.sendMessage(tab.id, {cmd: 'startCapture'});
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
        await createTab('https://github.com/yooper/your-rapport')

    }
    else if (details.reason === 'update') {
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
  if (changeInfo.status === "complete") {
    ExtensionPin.setDefault(tab);
  }
});

