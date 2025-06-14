/*
 * @license
 * @Copyright Baker Street Enterprises LLC
 * All rights reserved. Copying, distributing or modifying of software is prohibited for commercial purposes.
 * Please contact support@bakerstreet.llc for assistance
 */

import { autoScroller, initAutoScrollerHandler } from './modules/autoScroller';
import { initMarkJsHandler } from './modules/markText';
import { RAPPORT } from '../../services/constants';
import { getVisibleText } from './modules/visibleElements';

const pageUuid = crypto.randomUUID();
var port = chrome.runtime.connect({name: RAPPORT});
var automation = null;
var state = 'new'; // current state of the content script


function getPageInfo(){
  return {
    uuid: pageUuid,
    title: document.title,
    contentType: document.contentType,
    url: document.URL,
    screenShotCount: 0,
    automation: automation,
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


const route = (message) => {
  const cmd = message.cmd;
  switch(cmd){
    case 'startCapture':
    case 'startAutomation':
      autoScroller(message);
      break;
    case 'getVisibleText':
      port.postMessage(composeMessage({ cmd : message.cmd, text: getVisibleText() }));
      break;
    case 'setAutomation':
      automation = message.automation;
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
