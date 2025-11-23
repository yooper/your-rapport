import { getVisibleText } from './visibleElements';
import {
  ACTIVATE_AUTOMATION,
  ACTIVATE_CAPTURE, AUTO_COLLECT_MAX_SCREENSHOTS, AUTO_COLLECT_SCROLLBAR_STOPPED, BULK_AUTOMATION,
  CAPTURE_VISIBLE_TAB, NO_VISIBLE_TEXT, UUID,
} from '../../../services/constants';
import { getPageInfo} from '../index';
import { debug } from '../../../services/logger_services';
import { updateRecord } from '../../../models/db/local';

const STATE_STOPPED = 'stopped';
const STATE_INITIALIZED = 'initialized';
const STATE_ACTIVE = 'active';

let capturedHeight = 0;
// global var to track the number of screenshots captured thus far, used to mark the sequential order
let screenCollectionCount = 0;
let automation = null;
/**
 * Used to detect non-scrolling issue
 * @type {number}
 */
let previousWindowScrollY = -1;
export var state = STATE_INITIALIZED;


/**
 * TODO: Utility function for doing scrolling captures dependent on the website.
 * @returns {{scrollElement: Node, direction: string}|{scrollElement: HTMLElement, direction: string}|{scrollElement: Element, direction: string}}
 */
function getScrollDetailsByHostName() {
  return { scrollElement: document.documentElement, direction: 'down' };
}

function setAutomation(msg){
  if('automation' in msg){
    automation = msg.automation;
  }
}

/**
 * Scrolls up or down depending upon which host it is trying to scan.
 * @param message the message received from the background worker
 * @returns {void}
 */
export function autoScroller(message) {
  previousWindowScrollY = -1;
  setAutomation(message);

  if (state === STATE_ACTIVE) {
    state = STATE_STOPPED;
  } else if ([ACTIVATE_AUTOMATION,ACTIVATE_CAPTURE].includes(message.cmd)) {
    state = STATE_ACTIVE;
  } else {
    // stop the script from running
    state = STATE_STOPPED;
  }

  if (state === STATE_STOPPED) {
    debug('Autoscroller stopped', message);
    processAutomation('Automation stopped')
    return;
  }

  const autoScroll = () => {

    if (state !== STATE_ACTIVE) {
      debug('Autoscroller stopped', message);
      processAutomation('Automation stopped')
      return;
    }
    const { scrollElement, direction } = getScrollDetailsByHostName();
    // Get the initial values for the height
    const { scrollHeight, clientHeight } = scrollElement;
    const scrollAmount = clientHeight;

    (async () => {
      const visibleText = getVisibleText();
      if (!visibleText) {
        state = STATE_STOPPED; // stops the scrolling capture if the text is not being read in
        await debug('could not capture text');
        await processAutomation('Text could not be read in.');
        const response = await chrome.runtime.sendMessage({
          cmd: NO_VISIBLE_TEXT,
          pageInfo: {...await getPageInfo(), automation,...{sequence: screenCollectionCount++} }
        });
        await debug('The response from the service worker', response)
        return;
      }

      // send message to the service worker
      const response = await chrome.runtime.sendMessage({
        cmd: CAPTURE_VISIBLE_TAB,
        pageInfo: {...await getPageInfo(), automation,...{sequence: screenCollectionCount++} }
      });

      // the capture did not persist in the service worker
      if (!('completed' in response)) {
        state = STATE_STOPPED; // stops the scrolling capture if the text is not being read in
        await processAutomation(`Failed to save`);
        await debug('Could not save rapport, stopping loop', {...await getPageInfo()});
        return;
      }
      else if(automation) {
        // update the record count
        automation.screenShotsCollected = screenCollectionCount;
        await updateRecord(BULK_AUTOMATION, UUID, automation);
      }

      // TODO fix this so auto scroll doesn't fire
      // don't scroll, it's only a single page, no scroll bar
      if (
        scrollAmount == 0 ||
        document.documentElement.scrollHeight ===
          document.documentElement.clientHeight
      ) {
        state = STATE_STOPPED; // stops the scrolling capture
        // send message to the service worker
        const response = await chrome.runtime.sendMessage({
          cmd: AUTO_COLLECT_SCROLLBAR_STOPPED,
          pageInfo: {...await getPageInfo(), automation,...{sequence: screenCollectionCount} }
        });
        await processAutomation('Automation finished, non-scrollable page')
        await debug('Scroll bar did not move, response from service worker', response);
        return;
      }

      //TODO needs some work
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight
      ) {
        state = STATE_STOPPED;
        const response = await chrome.runtime.sendMessage({
          cmd: AUTO_COLLECT_SCROLLBAR_STOPPED,
          pageInfo: {...await getPageInfo(), automation,...{sequence: screenCollectionCount} }
        });
        await processAutomation('Automation finished, couldn\'t keep scrolling');
        await debug('Scroll bar did not move, response from service worker', response);
        return;
      }

      if (previousWindowScrollY !== window.scrollY) {
        previousWindowScrollY = window.scrollY;
      }
      // the screen is not scrolling
      else {
        await debug('Window not scrolling');
        state = STATE_STOPPED;
        const response = await chrome.runtime.sendMessage({
          cmd: AUTO_COLLECT_SCROLLBAR_STOPPED,
          pageInfo: {...await getPageInfo(), automation,...{sequence: screenCollectionCount} }
        });
        await debug('window stopped scrolling', response);
        await processAutomation('Automation finished, window not scrolling');
        return;
      }

      if (direction === 'down') {
        capturedHeight += scrollAmount;
        if (state !== STATE_ACTIVE) {
          await debug('capture stopped');
        } else if (capturedHeight < scrollHeight) {
          // Scroll to the next part of the page, after the screenshot has been taken
          scrollElement.scrollTo(0, capturedHeight);
        }
      } else {
        capturedHeight -= scrollAmount;
        // Check if the new position is less than 0, set to 0 if it is
        if (capturedHeight < 0) {
          scrollElement.scrollTop = 0;
        } else {
          scrollElement.scrollTop = capturedHeight;
        }
      }

      if (automation && screenCollectionCount >= automation.value) {
        const response = await chrome.runtime.sendMessage({
          cmd: AUTO_COLLECT_MAX_SCREENSHOTS,
          pageInfo: {...await getPageInfo(), automation,...{sequence: screenCollectionCount} }
        });
        await processAutomation('max screenshots collected');
        await debug('max screenshots collected', {pageInfo: await getPageInfo()})
        state = STATE_STOPPED;
        return;
      }

      // do not keep scrolling and capturing if the state is invalid
      if (state === STATE_ACTIVE) {
        // restart the functionality for scraping
        // TODO: Make a browser configuration
        setTimeout(autoScroll, 1500); // TODO: Adjust the delay as needed, make it a configuration setting
      }
    })();
  };

  autoScroll();
}

/**
 * End the automation process, if there is one
 * @param automation
 */
async function processAutomation(description = null){
  if(automation){
    automation.completedOn = Date.now();
    automation.screenShotsCollected = screenCollectionCount;
    automation.description = description;
    automation.status = 'done';
    await updateRecord(BULK_AUTOMATION, UUID, automation);
    state = STATE_STOPPED;
  }
}
