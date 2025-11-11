import {
  ACTIVATE_AUTOMATION,
  ACTIVATE_CAPTURE,
  AUTO_COLLECT_STARTING,
  BULK_AUTOMATION,
  PAGE_INITIALIZED,
  PROCESS_QUEUE_AUTOMATION_URLS,
  RAPPORT,
  UUID,
} from '../services/constants';
import { capture } from '../datasources/browser_capture';
import BulkAutomationUrl from '../models/schemas/BulkAutomationUrl';
import { getLocalItem, updateRecord } from '../models/db/local';
import { createTab } from './loaders';
import { debug } from '../services/logger_services';
import { captureSingleScreenShot } from '../services/collection_services';
import { getActiveAutomation, setActiveAutomation } from '../pages/Background';

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

    // TODO: create re-connect strategy
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
      debug('Message received but no tab.');
      return;
    }
    debug('Message received:', message);
    const response = processReceivedMessage(
      this.port.sender.tab,
      message
    );
    // sends back a response
    if (response) {
      debug('response being sent to the tab is:', response)
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
 * This can disconnect and not work
 * TODO: add statefulness validation
 * @param message
 * @param tab
 * @returns {{}}
 */
export async function processReceivedMessage(tab, message) {
  // process the request from the service worker while autoscroll in the UI is activated.
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
      const completedAutomation = 'activeAutomation' in message ? message.activeAutomation : null

      // mark automation as completed
      if(completedAutomation){
        await debug('Completed automation details', completedAutomation)
        await updateRecord(BULK_AUTOMATION, UUID, completedAutomation)
      }
      const activeAutomation = await BulkAutomationUrl.getAndSetNextAutomation();
      if(!activeAutomation){
        debug('No automations to run');
        return
      }
      else{

        if(new URL(tab?.url).hostname === new URL(activeAutomation.url).hostname){
          debug('The current tab has the same url as the upcoming active automation.')
        }
        setActiveAutomation(activeAutomation);
        await createTab(activeAutomation.url);
        debug(`Automation ${activeAutomation.url} Tab Opened`, { tab, activeAutomation });
      }
      break;
    // the content script is ready
    case PAGE_INITIALIZED:
      portManager.addTabInfo(tab, message);
      const currentAutomation = getActiveAutomation();
      if (!activeAutomation) {
        debug(PAGE_INITIALIZED+': No active automation');
        return false; // stop processing in calling function if false is returned
      }

      if (message.isAutomationBlockerDetected) {
        debug(
          `Page Automation Blocker detected, pausing automation.`,
          currentAutomation
        );
        activeAutomation.description = 'Page automation blocker detected';
        activeAutomation.active = false;
        activeAutomation.ranOn = Date.now();
        activeAutomation.completedOn = Date.now();
        await updateRecord(BULK_AUTOMATION, UUID, activeAutomation);

        // start next automation, since this one failed.
        const nextActiveAutomation = await BulkAutomationUrl.getAndSetNextAutomation();
        if (nextActiveAutomation) {
          debug('Launching next automation url', nextActiveAutomation);
          setActiveAutomation(nextActiveAutomation);
          await createTab(nextActiveAutomation.url);
        }
        return false; // stop processing in calling function if false is returned
      }
      // host names match does better than exact url match
      if (new URL(message.url).hostname === new URL(activeAutomation.url).hostname) {
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
