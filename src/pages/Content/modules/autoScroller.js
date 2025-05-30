import { getVisibleText } from './visibleElements';
import { updateRecord } from '../../../models/db/local';
import { BULK_AUTOMATION, UUID } from '../../../services/constants';

let state = 'stopped';
let capturedHeight = 0;
// global var to track the number of screenshots captured thus far, used to mark the sequential order
let screenCollectionCount = 0;
let automation = null;

/**
 * Listen for the message to start scrolling and issuing page saves
 */
export function initAutoScrollerHandler() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(`message received ${message.cmd}`);
    if(['autoscrollCollect'].includes(message.cmd)){
      return; // ignore this command
    }
    if (state === 'startCapture' && message.cmd === 'startCapture') {
      // we are already scrolling, lets cancel the auto scrolling.
      state = 'stopCapture';
    }
    else if (message.cmd === 'getVisibleText') {
      sendResponse({ text: getVisibleText() });
      return; // stop processing the request
    }
    else {
      state = message.cmd;
    }

    if('automation' in message){
      automation = message.automation;
    }

    // TODO check for an invalid state before proceeding
    autoScroller(message);
  });
}

/**
 * TODO: Utility function for doing scrolling captures dependent on the website.
 * @returns {{scrollElement: Node, direction: string}|{scrollElement: HTMLElement, direction: string}|{scrollElement: Element, direction: string}}
 */
function getScrollDetailsByHostName() {
  return { scrollElement: document.documentElement, direction: 'down' };
}

/**
 * Scrolls up or down depending upon which host it is trying to scan.
 * @param message the message received
 * @returns {boolean}
 */
export function autoScroller(message) {

  const autoScroll = () => {

    if (state !== 'startCapture') {
      console.log('capture stopped');
      return;
    }
    const { scrollElement, direction } = getScrollDetailsByHostName();
    // Get the initial values for the height
    const { scrollHeight, clientHeight } = scrollElement;
    const scrollAmount = clientHeight;

    (async() => {
      const text = getVisibleText();
      if (!text) {
        state = 'stopCapture'; // stops the scrolling capture if the text is not being read in
        console.log('could not capture text');
        return;
      }

      let response = null;
      let maxRetries = 5;
      let counter = 0;
      do{
        try{
          response = await chrome.runtime.sendMessage({
            cmd: 'captureVisibleTab',
            text: text,
            sequence: screenCollectionCount++,
          });

          // the capture did not complete
          if(!('completed' in response)){
            state = 'stopCapture'; // stops the scrolling capture if the text is not being read in
            console.log('could not save rapport');
          }
        }
        catch(error){
          state = 'stopCapture';
          console.error(error);
        }
      } while(!('completed' in response) || counter++ < maxRetries);

      // too many attempts
      if(counter >= maxRetries){
        state = 'stopCapture';
        processAutomation(message);
        return;
      }

      // TODO fix this so auto scroll doesn't fire
      // don't scroll, it's only a single page, no scroll bar
      if (scrollAmount == 0 || document.documentElement.scrollHeight === document.documentElement.clientHeight) {
        state = 'stopCapture'; // stops the scrolling capture
        processAutomation(message);
        return;
      }
      //TODO needs some work
      if(window.innerHeight + window.scrollY >= document.documentElement.scrollHeight){
        state = 'stopCapture';
        processAutomation(message);
        return;
      }

      if (direction === 'down') {
        capturedHeight += scrollAmount;
        if (capturedHeight < scrollHeight) {
          // Scroll to the next part of the page, after the screenshot has been taken
          scrollElement.scrollTo(0, capturedHeight);
        }
      }
      // TODO: Support upward scrolling sites
      else {
        capturedHeight -= scrollAmount;
        // Check if the new position is less than 0, set to 0 if it is
        if (capturedHeight < 0) {
          scrollElement.scrollTop = 0;
        } else {
          scrollElement.scrollTop = capturedHeight;
        }
      }

      if('automation' in message){
        if(state !== "startCapture" || (message.automation.unit === 'count' && message.automation.value < screenCollectionCount)){
          state = 'stopCapture'; // max screenshots
          processAutomation(message);
          return;
        }
      }

      // do not keep scrolling and capturing if the state is invalid
      if (state == 'startCapture') {
        // restart the functionality for scraping
        setTimeout(autoScroll, 1500); // TODO: Adjust the delay as needed, make it a configuration setting
      }
    })();
  };

  autoScroll();
  return true;
}

/**
 * End the automation process, if there is one
 * @param automation
 */
function processAutomation(message){
  if('automation' in message){
    let automation = message.automation;
    automation.completedOn = Date.now();
    automation.screenShotsCollected = screenCollectionCount;
    console.log('automation task completed')
    chrome.runtime.sendMessage({
      cmd: 'bulkCollectionComplete',
      automation: automation
    });
  }

}