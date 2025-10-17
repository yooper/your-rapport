import {
  ACTIVATE_AUTOMATION,
  ACTIVATE_CAPTURE,
  AUTO_COLLECT_STARTING,
  BULK_AUTOMATION,
  PAGE_INITIALIZED,
  PROCESS_QUEUE_AUTOMATION_URLS,
  RAPPORT,
  START_CAPTURE,
  STOP_SCRIPT,
  STOPPED,
  UUID,
} from '../services/constants';
import { capture } from '../datasources/browser_capture';
import { BulkAutomationUrl } from '../models/schemas/BulkAutomationUrl';
import { getLocalItem, updateRecord } from '../models/db/local';
import { createTab } from './loaders';
import { debug } from '../services/logger_services';
import { captureSingleScreenShot } from '../services/collection_services';
import { getActiveAutomation, setActiveAutomation } from '../pages/Background';
import { Configuration } from '../models/schemas/Configuration';

export class PortManager {
  constructor() {
    this.tabInfo = {};
    this.port = null;
  }

  getTabInfo() {
    return this.tabInfo;
  }

  connect(port) {
    if (port.name !== RAPPORT) {
      console.warn('Unrecognized port name:', port.name);
      return;
    }

    this.port = port;

    if (!port.sender?.tab) {
      debug('No tab associated with this port.');
      return;
    }

    if (this.tabInfo[port.sender.tab.id]) {
      debug('tab id should not exist.', port.sender.tab);
      //new Error('tab id should not already exist');
    }

    this.tabInfo[port.sender.tab.id] = port.sender.tab;

    port.onMessage.addListener(this.onMessage.bind(this));
    port.onDisconnect.addListener(() => {
      debug('Port disconnected');
      this.port = null;
    });
  }

  addTabInfo(tab, message) {
    this.tabInfo[tab.id] = { tab, pageInfo: message };
  }

  deleteTabInfo(tab) {
    if (Object.hasOwn(this.tabInfo, tab.id)) {
      debug('tab deleted ', this.tabInfo[tab.id]);
      delete this.tabInfo[tab.id];
    }
  }

  async onMessage(message) {
    if (!this.port?.sender?.tab) {
      console.warn('Message received but no tab.');
      return;
    }
    debug('Message received:', message);
    const response = await processReceivedMessage(
      this.port.sender.tab,
      message
    );
    if (response) {
      this.port.postMessage(response);
    }
  }

  getPort() {
    return this.port;
  }
}

export function initializePortConnection() {
  chrome.runtime.onConnect.addListener((port) => portManager.connect(port));
}

/**
 * Process the message, send a null or false to void sending a response back to the content script.
 * TODO: add statefulness validation
 * @param message
 * @param tab
 * @returns {{}}
 */
export async function processReceivedMessage(tab, message) {
  // whenever a request comes in to activate autoscroll while the ui is already scrolling
  // deactivate the scroll and end the automation.

  switch (message.cmd) {
    case AUTO_COLLECT_STARTING: // autoscroll collect was initiated through a manual action
      // capture the 1st screenshot then proceed
      await captureSingleScreenShot();
      chrome.tabs.sendMessage(tab.id, {
        cmd: ACTIVATE_CAPTURE,
        pageInfo: message,
        automation: null,
      });
      break;
    case PROCESS_QUEUE_AUTOMATION_URLS: // autoscroll collect was initiated through automation request
      const automations = (await getLocalItem(BULK_AUTOMATION)) ?? [];
      const found = automations.find((a) => !a.ranOn);
      if (!found) {
        debug('No automations to run');
        return;
      } else {
        debug(`Initializing automation ${found.url}`, found);
        found.active = true;
        found.ranOn = Date.now();
        await updateRecord(BULK_AUTOMATION, UUID, found);
        setActiveAutomation(found);
        await createTab(found.url);
        debug(`Automation ${found.url} Tab Opened`, { tab, found });
      }
      break;
    // the content script is ready
    case PAGE_INITIALIZED:
      portManager.addTabInfo(tab, message);
      const activeAutomation = getActiveAutomation();
      if (!activeAutomation) {
        debug('No active automation');
        return false; // stop processing in calling function if false is returned
      }

      // TODO: perform check in service worker too,
      //const parser = new DOMParser();
      //const document = parser.parseFromString(message.html ?? '', message.contentType)

      if (message.isAutomationBlockerDetected) {
        debug(
          `Page Automation Blocker detected, pausing automation.`,
          activeAutomation
        );
        activeAutomation.description = 'Page automation blocker detected';
        activeAutomation.active = false;
        await updateRecord(BULK_AUTOMATION, UUID, activeAutomation);
        // start next automation, since this one failed.
        const nextActiveAutomation =
          await BulkAutomationUrl.getAndSetNextAutomation();
        if (nextActiveAutomation) {
          debug('Launching next automation url', nextActiveAutomation);
          setActiveAutomation(nextActiveAutomation);
          await createTab(nextActiveAutomation.url);
        }
        return false; // stop processing in calling function if false is returned
      }
      // host names match does better than exact url match
      if (
        new URL(message.url).hostname === new URL(activeAutomation.url).hostname
      ) {
        // capture the 1st screenshot then proceed
        await capture(tab, message);
        // initialize the autocollect functionality in the content script
        chrome.tabs.sendMessage(tab.id, {
          cmd: ACTIVATE_AUTOMATION,
          automation: activeAutomation,
          pageInfo: message,
        });
      }
      return false;
    default:
      return false;
  }
  debug('Unknown command ' + message.cmd, message);
}

export const portManager = new PortManager();
export const getTabInfo = () => portManager.getTabInfo();
