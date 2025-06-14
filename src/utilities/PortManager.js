import { ACTIVATE_AUTOMATION, PAGE_INITIALIZED, RAPPORT } from '../services/constants';
import { capture } from '../datasources/browser_capture';
import { BulkAutomationUrl } from '../models/schemas/BulkAutomationUrl';

export class PortManager {
  constructor() {
    this.port = null;
  }

  connect(port) {
    if (port.name !== RAPPORT) {
      console.warn('Unrecognized port name:', port.name);
      return;
    }

    this.port = port;

    if (!port.sender?.tab) {
      console.warn("No tab associated with this port.");
      return;
    }

    port.onMessage.addListener(this.onMessage.bind(this));

    port.onDisconnect.addListener(() => {
      console.log('Port disconnected');
      this.port = null;
    });
  }

  async onMessage(message) {
    if (!this.port?.sender?.tab) {
      console.warn("Message received but no tab.");
      return;
    }
    console.log("Message received:", message);
    const response = await processReceivedMessage(message, this.port.sender.tab)
    if(response){
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
 * Process the message, send a null or false to not send a response back to the content script
 * @param message
 * @param tab
 * @returns {{}}
 */
async function processReceivedMessage(message, tab) {
  switch (message.cmd) {
    case PAGE_INITIALIZED:
      if(message.isAutomationBlockerDetected){
        console.log(`Page Automation Blocker detected`);
        return false; // stop processing in calling function if false is returned
      }
      else{
        const activeAutomation = await BulkAutomationUrl.getActiveAutomation();
        if(!activeAutomation){
          console.log('No active automation');
          return false // stop processing in calling function if false is returned
        }
        return { cmd: ACTIVATE_AUTOMATION, automation: activeAutomation }
      }

    case 'getVisibleText':
      await capture(tab, message);
      break;
    default:
      return { }
  }
  console.log('Unknown command '+ message.cmd, message)
}

export const portManager = new PortManager();

