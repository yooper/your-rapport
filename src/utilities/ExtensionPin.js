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

  static scanPage = (activeTab) => {
    ExtensionPin.setBgColorAndText('#619657', 'RUN', activeTab);
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
      ExtensionPin.setBgColorAndText('#E86E69', 'SAVG', activeTab);
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

  static showNumber = (number, activeTab) => {
    ExtensionPin.setBgColorAndText('#E86E69', '' + number, activeTab);
  };
}
