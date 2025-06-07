/*
 * @license
 * @Copyright Baker Street Enterprises LLC
 * All rights reserved. Copying, distributing or modifying of software is prohibited for commercial purposes.
 * Please contact support@bakerstreet.llc for assistance
 */

import { initAutoScrollerHandler } from './modules/autoScroller';
import { initMarkJsHandler } from './modules/markText';
import { INITIALIZED, RAPPORT } from '../../services/constants';

const pageId = crypto.randomUUID();
var port = chrome.runtime.connect({name: RAPPORT});

var scriptState = INITIALIZED;

/**
 * TODO: Improve error handling on disconnect
 */
port.onDisconnect.addListener((p) => {
  if (p.error) {
    console.log(`Disconnected due to an error: ${p.error.message}`);
  }
});


// upon connect send the page id to the service worker
port.postMessage({uuid: pageId});

/**
 * Process and route incoming messages
 */
port.onMessage.addListener((message) => {
  route(message);
});




const route = (message) => {
    port.postMessage({answer: "Madame"});
}

initAutoScrollerHandler();
initMarkJsHandler();
