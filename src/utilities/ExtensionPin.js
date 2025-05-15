
export default class ExtensionPin {

  static setBgColorAndText = (color, text) => {
    chrome.action.setBadgeBackgroundColor({ color: color }, () => {
      chrome.action.setBadgeText({ text: text }, () => {
      });
    });
  };

  static setDefault = () => {
    ExtensionPin.setBgColorAndText('#0000', '');
    chrome.action.setIcon({ path: "/icon-32.png" })
  };


  static showNumber = (number) => {
    ExtensionPin.setBgColorAndText('blue', number);
  };

}