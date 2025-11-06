/*
 * @license
 * @Copyright Baker Street Enterprises LLC
 * All rights reserved. Copying, distributing or modifying of software is prohibited for commercial purposes.
 * Please contact support@bakerstreet.llc for assistance
 */

import { autoScroller } from './modules/autoScroller';
import { initMarkJsHandler } from './modules/markText';
import {
  ACTIVATE_AUTOMATION,
  AUTOMATION_RUNNING,
  PAGE_INITIALIZED,
  RAPPORT,
} from '../../services/constants';
import { getVisibleText } from './modules/visibleElements';
import { debug } from '../../services/logger_services';
import { isAutomationBlockerDetected } from './modules/automationBlockerDetection';
import { waitForAllImagesToLoad } from '../../services/image_loading_services';

export const pageUuid = crypto.randomUUID();
export const port = chrome.runtime.connect({ name: RAPPORT });

/**
 *
 * @returns {{cmd: string, screenShotCount: number, text: string, title: string, uuid: string, contentType: string, url: string, isAutomationBlockerDetected: boolean}}
 */
function getPageInfo() {
  return {
    cmd: PAGE_INITIALIZED,
    uuid: pageUuid,
    title: document.title,
    contentType: document.contentType,
    html: document.documentElement.innerHTML,
    url: document.URL,
    screenShotCount: 0,
    isAutomationBlockerDetected: isAutomationBlockerDetected(document),
    visibleText: getVisibleText(),
    text: document.documentElement.innerText,
    createdOn: Date.now(),
    tab: null,
  };
}

/**
 * Upon connection send details about the page
 */
setTimeout(() => {
  port.postMessage(getPageInfo());
}, 2000); // give the page a couple seconds to load up.

/**
 * Check if the page automation is stuck after several seconds
 */
setTimeout(() => {

})


/**
 * Process and route incoming messages
 */
port.onMessage.addListener((message) => {
  route(message);
});

/** route one time messages */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  route(message);
});

/**
 * Process the incoming messages
 * @param message
 */
const route = (message) => {
  if (!('cmd' in message)) {
    debug('invalid command', message);
    return false;
  }

  const cmd = message.cmd;
  debug('Message received', message);

  autoScroller(message);

  switch (cmd) {
    // automated trigger
    case ACTIVATE_AUTOMATION:
      port.postMessage({
        cmd: AUTOMATION_RUNNING,
        automation: message.automation,
      });
      return;
  }
};

/**
 * Helper function to wrap outbound messages
 * @param message
 * @returns {*&{pageInfo: {automation: null, screenShotCount: number, title: string, uuid: string, contentType: string, url: string}}}
 */
const composeMessage = (message) => {
  return { ...message, ...{ pageInfo: getPageInfo() } };
};

//initAutoScrollerHandler();
initMarkJsHandler();
waitForAllImagesToLoad();
