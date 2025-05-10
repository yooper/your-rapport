import {capture} from "../../datasources/browser_capture";
import {createTab, getActiveTab, installPackage} from "../../utilities/loaders";
import {updateRecord} from "../../models/db/local";
import {initializeContextMenus} from "../../services/context_menu_services";
import {Selector} from "../../models/schemas/Selector";


/**
 * Initialize configuration values when the app is installed
 */
chrome.runtime.onInstalled.addListener(async(details) => {
    // install the default discovery plugins
    const defaultDiscoveryPlugins = [
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/countries/us/sec-edgar.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/countries/us/california/sos-business-search.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/countries/us/illinois/il-sos-biz-search-by-name.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/countries/us/illinois/il-sos-biz-search-by-org.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/countries/us/michigan/lara-by-name.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/countries/us/michigan/lara-by-org-name.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/countries/us/ohio/oh-business-search-by-name.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/countries/us/ohio/oh-business-search-by-org.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/countries/us/wisconsin/wi-corporate-by-org-name.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/domains/url-scan-io.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/fast-people-search/fps-address.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/fast-people-search/fps-phone.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/forensics/cyber-chef.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/github/gh-save-screenshot.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/google/google-in-text-username.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/google/google-in-title-username.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/google/google-in-url-username.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/ngos/open-corporates/oc-search-by-name.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/ngos/open-corporates/oc-search-by-org.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/phones/caller-id.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/phones/experian-phone-verification.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/phones/ipqs-phone-validator.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/phones/phone-validator.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/phones/reverse-phone-checker.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/usernames/whats-my-name.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/usernames/who-am-i.json"
    ];
    await Promise.all(defaultDiscoveryPlugins.map(pluginUrl => {
        installPackage({url: pluginUrl}).catch(err => {

        })
    }))


})

await initializeContextMenus();

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
 * Receives messages from the content script or the extension page
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


