/*
 * @license
 * @Copyright Baker Street Enterprises LLC
 * All rights reserved. Copying, distributing or modifying of software is prohibited for commercial purposes.
 * Please contact support@bakerstreet.llc for assistance
 */

import { autoScroller, initAutoScrollerHandler } from './modules/autoScroller';
import { initMarkJsHandler } from './modules/markText';
import { ACTIVATE_AUTOMATION, AUTOMATION_RUNNING, BULK_AUTOMATION, RAPPORT } from '../../services/constants';
import { getVisibleText } from './modules/visibleElements';
import { isAutomationBlockerDetected } from './modules/automationBlockerDetection';

const pageUuid = crypto.randomUUID();
let port = chrome.runtime.connect({name: RAPPORT});

/**
 *
 * @returns {{cmd: string, screenShotCount: number, text: string, title: string, uuid: string, contentType: string, url: string, isAutomationBlockerDetected: boolean}}
 */
function getPageInfo(){
  return {
    cmd: 'pageInitialized',
    uuid: pageUuid,
    title: document.title,
    contentType: document.contentType,
    url: document.URL,
    screenShotCount: 0,
    isAutomationBlockerDetected: false,
    text: getVisibleText()
  }
}


/**
 * Upon connection send details about the page
 */
port.postMessage(getPageInfo());

/**
 * Process and route incoming messages
 */
port.onMessage.addListener((message) => {
  route(message);
});


/**
 * Process the incoming messages
 * @param message
 */
const route = (message) => {
  const cmd = message.cmd;
  console.log(`received `, [], message);
  switch(cmd){
    case ACTIVATE_AUTOMATION:
      autoScroller(message);
      port.postMessage({cmd: AUTOMATION_RUNNING, automation: message.automation })
      return;
    case 'startCapture':
    case 'startAutomation':
      autoScroller(message);
      break;
    case 'getVisibleText':
      port.postMessage(composeMessage({ cmd : message.cmd, text: getVisibleText() }));
      break;
  }
}

/**
 * Helper function to wrap outbound messages
 * @param message
 * @returns {*&{pageInfo: {automation: null, screenShotCount: number, title: string, uuid: string, contentType: string, url: string}}}
 */
const composeMessage = (message) => {
  return {...message, ...{ pageInfo : getPageInfo() } }
}


initAutoScrollerHandler();
initMarkJsHandler();
