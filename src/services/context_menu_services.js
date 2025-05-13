import {capture} from "../datasources/browser_capture";
import {Selector} from "../models/schemas/Selector";
import {getSelectorTypeMap} from "../utilities/loaders";

/**
 * Add the selectors as menu items
 * @returns {Promise<void>}
 */
export async function initializeContextMenus() {

    await chrome.contextMenus.removeAll()

    // add capture context menu to the UI
    chrome.contextMenus.create({
        id: "collectPage",
        title: "Collect",
        contexts: ["page"]
    });

    // add a seperator
    chrome.contextMenus.create({type: 'separator', 'id': 'separator_1', "contexts": ["selection"]});
    for (const [key, label] of Object.entries(getSelectorTypeMap())) {
        chrome.contextMenus.create({
            "title": `Capture text as a ${label}`,
            "id": key,
            "contexts": ["selection"],
            "type": "normal"
        });
    }
    // add event listeners
    chrome.contextMenus.onClicked.addListener(async (info, tab) => {
        switch (info.menuItemId) {
            case 'collectPage':
                // get the visible text from the content script.
                const response = await chrome.tabs.sendMessage(tab.id, {cmd: 'getVisibleText'});
                await capture(tab, response);
                break;
            default:
                const selectorTypeName = info.menuItemId;
                const key = info.selectionText;
                await Selector.add(new Selector(key, selectorTypeName));
                break;
        }
    });
}
