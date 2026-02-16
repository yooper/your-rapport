/* eslint-disable @typescript-eslint/no-unused-vars */
/*
 * @license
 * @Copyright Baker Street Enterprises LLC
 * All rights reserved. Copying, distributing or modifying of software is prohibited for commercial purposes.
 * Please contact support@bakerstreet.llc for assistance
 */

import {
  ACTIVATE_AUTOMATION,
  ACTIVATE_CAPTURE,
  AUTOMATION_RUNNING,
  BULK_AUTOMATION, PAGE_INFO,
  PAGE_INITIALIZED, STOPPED,
} from '../../services/constants';
import { getVisibleText, getVisibleHtml } from './modules/visibleElements';
import { isAutomationBlockerDetected } from './modules/automationBlockerDetection';
import { IBulkAutomationRecord, PageInfo } from '../../types';
import { debug } from '../../services/logger_services';
import { autoScroller } from './modules/autoScroller';

// --- Types ------------------------------------------------------------------

type Command =
  | typeof PAGE_INITIALIZED
  | typeof ACTIVATE_AUTOMATION
  | typeof ACTIVATE_CAPTURE
  | typeof BULK_AUTOMATION
  | typeof AUTOMATION_RUNNING;


// --- State ------------------------------------------------------------------

export const pageUuid: string = crypto.randomUUID();

/**
 * Used to track the automation that initiated the page
 */
let _automation: IBulkAutomationRecord|null = null;

function setAutomation(msg: any){
  if('automation' in msg){
    _automation = msg.automation;
  }
}

function getAutomation(): IBulkAutomationRecord|null
{
  return _automation;
}

let _tab: any = null;

function setTab(msg: any){
  if('tab' in msg){
    _tab = msg.tab;
  }
}

function getTab(){
  return _tab
}


// --- Helpers ----------------------------------------------------------------

/**
 * Build the current page info snapshot.
 */
export function getPageInfo(): PageInfo {
  return {
    uuid: pageUuid,
    title: document.title,
    contentType: document.contentType,
    html: document.documentElement.innerHTML,
    url: document.URL,
    screenShotCount: 0,
    visibleText: getVisibleText(),
    visibleHtml: '',
    text: document.documentElement.innerText,
    createdOn: Date.now(),
    tab: getTab(),
    automation: getAutomation(),
    sequence: 0
  };
}


// --- Initialization ---------------------------------------------------------

//const port = chrome.runtime.connect({name: "your-rapport-port"});
let isRunning = false;


chrome.runtime.onMessage.addListener((msg: any, sender, sendResponse) => {
  setAutomation(msg);
  setTab(msg);
  const pageInfo = getPageInfo();
  switch(msg.cmd){
    case PAGE_INFO:
      sendResponse({pageInfo});
      return true;
    case ACTIVATE_AUTOMATION:
    case ACTIVATE_CAPTURE:
      autoScroller(msg);
      sendResponse({isRunning: true, msg, pageInfo});
      return true;
    default:
      sendResponse({isRunning: false, msg, pageInfo});
      autoScroller(msg)
      debug('default', {msg, pageInfo: getPageInfo()})
      break;

  }

});

const signInHandler = (): void => {
  const links = document.querySelectorAll<HTMLAnchorElement>('.yr-sign-in-link');
  links.forEach((link) => {
    link.addEventListener('click', async(e: MouseEvent) => {
      e.preventDefault();
      const url = link.href;
      const response = await chrome.runtime.sendMessage({ cmd: 'createTab', url });
    });
  });
};

// special case for doing authentication
if (window.location.hostname === "bakerstreet.llc") {
    signInHandler();
}
