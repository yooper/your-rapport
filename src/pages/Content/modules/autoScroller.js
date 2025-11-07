import { getVisibleText } from './visibleElements';
import { updateRecord } from '../../../models/db/local';
import {
  ACTIVATE_AUTOMATION,
  ACTIVATE_CAPTURE,
  BULK_AUTOMATION,
  CAPTURE_VISIBLE_TAB,
  PROCESS_QUEUE_AUTOMATION_URLS,
  UUID,
} from '../../../services/constants';
import { port } from '../index';
import { debug } from '../../../services/logger_services';

const STATE_STOPPED = 'stopped';
const STATE_INITIALIZED = 'initialized';
const STATE_ACTIVE = 'active';
const MAX_SCREENSHOTS = 100;

let capturedHeight = 0;
// global var to track the number of screenshots captured thus far, used to mark the sequential order
let screenCollectionCount = 0;
let automation = null;
/**
 * Used to detect non-scrolling issue
 * @type {number}
 */
let previousWindowScrollY = -1;

let state = STATE_INITIALIZED;

export function getAutoScrollState() {
  return state;
}

export function setAutoScrollState(setState) {
  return (state = setState);
}

export function getAutomation() {
  return automation;
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
 * @param message the message received from the background worker
 * @returns {boolean}
 */
export function autoScroller(message) {
  previousWindowScrollY = -1;

  if (state === STATE_ACTIVE) {
    state = STATE_STOPPED;
  } else if (message.cmd === ACTIVATE_AUTOMATION) {
    automation = message.automation;
    state = STATE_ACTIVE;
  } else if (message.cmd === ACTIVATE_CAPTURE) {
    state = STATE_ACTIVE;
  } else {
    // stop the script from running
    state = STATE_STOPPED;
  }

  if (state === STATE_STOPPED) {
    processAutomation();
    debug('stop', message);
    return false;
  }

  const autoScroll = () => {
    if (state !== STATE_ACTIVE) {
      debug('capture stopped');
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
        debug('could not capture text');
        processAutomation('Text could not be read in.');
        return;
      }
      // send message to the service worker
      const response = await chrome.runtime.sendMessage({
        cmd: CAPTURE_VISIBLE_TAB,
        visibleText: visibleText,
        sequence: screenCollectionCount++,
        automation: automation, // can be null
      });

      // update the bulk automation record
      if (automation) {
        automation.screenShotsCollected = screenCollectionCount;
        await updateRecord(BULK_AUTOMATION, UUID, automation);
      }

      // the capture did not persist in the service worker
      if (!('completed' in response)) {
        state = STATE_STOPPED; // stops the scrolling capture if the text is not being read in
        processAutomation('storage failed to save');
        debug('Could not save rapport');
        return;
      }

      // TODO fix this so auto scroll doesn't fire
      // don't scroll, it's only a single page, no scroll bar
      if (
        scrollAmount == 0 ||
        document.documentElement.scrollHeight ===
          document.documentElement.clientHeight
      ) {
        state = STATE_STOPPED; // stops the scrolling capture
        processAutomation('scroll stopped by user');
        return;
      }
      //TODO needs some work
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight
      ) {
        state = STATE_STOPPED;
        processAutomation();
        return;
      }

      if (previousWindowScrollY !== window.scrollY) {
        previousWindowScrollY = window.scrollY;
      }
      // the screen is not scrolling
      else {
        debug('Window not scrolling');
        state = STATE_STOPPED;
        processAutomation('window not scrolling');
        return;
      }

      if (direction === 'down') {
        capturedHeight += scrollAmount;
        if (state !== STATE_ACTIVE) {
          debug('capture stopped');
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

      if (automation) {
        if (
          state !== STATE_ACTIVE ||
          (automation.unit === 'count' &&
            automation.value < screenCollectionCount)
        ) {
          state = STATE_STOPPED; // max screenshots
          debug(
            `Max screenshots captured for automation ${automation.url}`,
            automation
          );
          processAutomation('Max screenshots captured');
          return;
        }
      } else if (screenCollectionCount > MAX_SCREENSHOTS) {
        debug(`Max screenshots captured for autoscroll collect.`, message);
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
  return true;
}

/**
 * End the automation process, if there is one
 * @param automation
 */
function processAutomation(description = null) {
  if (automation) {
    automation.completedOn = Date.now();
    automation.screenShotsCollected = screenCollectionCount;
    automation.description = description;
    automation.ranOn = Date.now();
    automation.active = false;
      updateRecord(BULK_AUTOMATION, UUID, automation).then(() => {
      debug(`processAutomation: Completed with reason: ${description}`, automation);
      try{
        // TODO: Investigate whether to reconnect, when port is undefined would work better
        if(port !== undefined) {
          port.postMessage({ cmd: PROCESS_QUEUE_AUTOMATION_URLS });
        }
      }
      catch(e) {
        debug(String(e), { method: 'processAutomation' })
      }
    })
  }
}
