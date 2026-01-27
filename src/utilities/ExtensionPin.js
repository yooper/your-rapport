import { debug } from '../services/logger_services';

export default class ExtensionPin {
  /**
   *
   * @param color
   * @param text
   * @param tabId
   * @param windowId
   */
  static setBgColorAndText = (
    color,
    text,
    activeTab = null,
    windowId = null
  ) => {
    chrome.action.setBadgeBackgroundColor({ color: color }, () => {
      let data = { text: text };
      if (activeTab) {
        data['tabId'] = activeTab.tabId;
      }
      chrome.action.setBadgeText(data, () => {});
    });
  };

  static setDefaultSaved = (activeTab = null) => {
    if (activeTab) {
      ExtensionPin.setBgColorAndText('#619657', 'SAVD', activeTab);
    } else {
      // globally reset all badges
      chrome.action.setIcon({ path: '/icon-32.png' });
      ExtensionPin.setBgColorAndText('#619657', '');
    }
  };

  static setDefaultNotSaved = (activeTab = null) => {
    if (activeTab) {
      ExtensionPin.setBgColorAndText('#ffe88b', 'SAVG', activeTab);
    } else {
      // globally reset all badges
      chrome.action.setIcon({ path: '/icon-32.png' });
      ExtensionPin.setBgColorAndText('#619657', '');
    }
  };

  static setDefault = (activeTab = null) => {
    if (activeTab) {
      ExtensionPin.setBgColorAndText('#E86E69', '', activeTab);
    } else {
      // globally reset all badges
      chrome.action.setIcon({ path: '/icon-32.png' });
      ExtensionPin.setBgColorAndText('#E86E69', '');
    }
  };

  static setTemporaryPin = (message, activeTab = null) => {
    if (activeTab) {
      ExtensionPin.setBgColorAndText('#ffe88b', message, activeTab);
    } else {
      // globally reset all badges
      ExtensionPin.setBgColorAndText('#E86E69', message, activeTab);
    }

    setTimeout(() => {
      ExtensionPin.setDefault(activeTab);
    }, 3000);
  };


  static setTempErrorPin = (message, activeTab = null) => {
    ExtensionPin.setBgColorAndText('red', 'ERR', activeTab);
    debug('setTempErrorPin', {message});
    setTimeout(() => {
      ExtensionPin.setDefault(activeTab);
    }, 3000);
  }

  static showNumber = (number, activeTab) => {
    ExtensionPin.setBgColorAndText('#E86E69', '' + number, activeTab);
  };

  /**
   * Show the percent left of automations
   * @param automations
   */
  static setAutomationRunning = (automations) => {
    const percent = Math.round(100 *
      (automations.filter(a => a.ranOn && a.active).length / automations.filter(a => a.active).length));
    ExtensionPin.showNumber(percent + '%');
  }
}
