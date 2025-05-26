import { getVisibleText } from './visibleElements';

let state = 'stopped';
let capturedHeight = 0;
// global var to track the number of screenshots captured thus far, used to mark the sequential order
let screenCollectionCount = 0;

/**
 * Listen for the message to start scrolling and issuing page saves
 */
export function initAutoScrollerHandler() {
  // stop scrolling and auto capture is turned off in another module
  window.addEventListener('scroll', () => {
    if (
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight
    ) {
      setTimeout(() => {
        // check we are at the bottom and no ajax load occurred and changed the scroll height
        if (
          window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight
        ) {
          state = 'bottom';
        }
      }, 2000);
    }
    if (state !== 'startCapture') {
      const { scrollElement } = getScrollDetailsByHostName();
      capturedHeight = scrollElement.scrollTop;
    }
  });

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

    // TODO check for an invalid state before proceeding
    autoScroller(message);

  });
}

/**
 * Check for the xpath
 * @param xpath
 * @returns {Node|null}
 */
function getElementByXPath(xpath) {
  // Evaluate the XPath against the document
  const result = document.evaluate(
    xpath,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  );
  // Return the node if found
  return result?.singleNodeValue ?? null;
}

/**
 * Utility function for doing scrolling captures dependent on the web site.
 * @returns {{scrollElement: Node, direction: string}|{scrollElement: HTMLElement, direction: string}|{scrollElement: Element, direction: string}}
 */
function getScrollDetailsByHostName() {
  const path = window.location.pathname;
  switch (window.location.host) {
    case 'web.telegram.org':
      return {
        scrollElement: document.querySelector(
          '#column-center > div > div > div.bubbles.is-chat-input-hidden.has-groups.has-sticky-dates > div.scrollable.scrollable-y'
        ),
        direction: 'up',
      };
    case 'discord.com':
      return {
        scrollElement: getElementByXPath(
          '//*[@id="app-mount"]/div[2]/div[1]/div[1]/div/div[2]/div/div/div/div/div[3]/div[3]/main/div[1]/div'
        ),
        direction: 'up',
      };
    default:
      return { scrollElement: document.documentElement, direction: 'down' };
  }
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
        state = 'stopped'; // stops the scrolling capture if the text is not being read in
        console.log('could not capture text');
        return;
      }
      const response = chrome.runtime.sendMessage({
        cmd: 'captureVisibleTab',
        text: text,
        sequence: screenCollectionCount++,
      });
      // TODO fix this so auto scroll doesn't fire
      // don't scroll, it's only a single page, no scroll bar
      if (scrollAmount == 0) {
        state = 'stopCapture'; // stops the scrolling capture
      }

      if (direction === 'down') {
        capturedHeight += scrollAmount;
        if (state !== 'startCapture') {
          console.log('capture stopped');
        }
        else if (capturedHeight < scrollHeight) {
          // Scroll to the next part of the page, after the screenshot has been taken
          scrollElement.scrollTo(0, capturedHeight);
        }
      }
      else {
        capturedHeight -= scrollAmount;
        // Check if the new position is less than 0, set to 0 if it is
        if (capturedHeight < 0) {
          scrollElement.scrollTop = 0;
        } else {
          scrollElement.scrollTop = capturedHeight;
        }
      }
      // TODO check that all ajax requests have finished
      setTimeout(autoScroll, 1000); // TODO: Adjust the delay as needed, make it a configuration setting

      if('automation' in message){
        if(message.automation.unit === 'count' && message.automation.value < screenCollectionCount){
          state = 'stopCapture'; // max screenshots
          message.automation.completedOn = Date.now();
          message.screenShotCount = screenCollectionCount;
          console.log('automation task completed')
          // send the message to stop
          chrome.runtime.sendMessage({
            cmd: 'bulkCollectionComplete',
            automation: message.automation
          });
        }
      }
    })();
  };
  autoScroll();
  return true;
}
