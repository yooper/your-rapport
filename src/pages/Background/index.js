import {capture} from "../../datasources/browser_capture";
import {createTab, getActiveTab} from "../../utilities/loaders";
import {updateRecord} from "../../models/db/local";

/**
 * When Icon in top right is clicked it opens the search option
 */
chrome.action.onClicked.addListener(async(tab) => {
    await chrome.tabs.create({'url': chrome.runtime.getURL('search.html')})
});

/**
 * Initialize configuration values when the app is installed
 */
chrome.runtime.onInstalled.addListener(async(details) => {
    // add capture context menu to the UI
    chrome.contextMenus.create({
      id: "collectPage",
      title: "Collect",
      contexts: ["page"]
    });
})

/**
 * Add onclick event to the context menu item
 */
chrome.contextMenus.onClicked.addListener(async(info, tab) => {
  if (info.menuItemId === "collectPage") {
      // get the visible text from the content script.
      const response = await chrome.tabs.sendMessage(tab.id, {cmd: 'getVisibleText'});
      await capture(tab, response);
  }
});

/**
 * Add in support for short-cut keys
 */
chrome.commands.onCommand.addListener(async(command) => {

    if(command === 'openDashboard'){
        await createTab(chrome.runtime.getURL('search.html'), false);
        return;
    }

    const activeTab = await getActiveTab();
    switch(command){
        case 'singleCapture':
            const response = await chrome.tabs.sendMessage(activeTab.id, {cmd: 'getVisibleText'});
            await capture(activeTab, response);
            break;
        default:
            const defaultResponse = await chrome.tabs.sendMessage(activeTab.id, {cmd: command});
            await capture(activeTab, defaultResponse);
            break;
    }
});


/**
 * Receive messages from the content script or the extension page
 */
chrome.runtime.onMessage.addListener( async(message, sender, sendResponse) => {
    switch(message.cmd){
        case 'captureVisibleTab':
          await capture(sender.tab, message)
          sendResponse({flag: true});
          return true;
        case 'updateScreenShotRecord':
          await updateRecord('screenshots', 'uuid', message.record);
          sendResponse({completed: true});
          return true;
        default:
            console.log(`Unknown cmd ${message.cmd}`);
            return true;
    }
});

/**
 * On install open the github page
 */
chrome.runtime.onInstalled.addListener(async (details) => {

//chrome.runtime.setUninstallURL('https://link.reachpenguin.com/widget/survey/OtuDAzickWrbYvAlLE1M');
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


