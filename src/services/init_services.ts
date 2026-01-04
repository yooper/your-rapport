
export const initExtensionPage = (): void => {
  try{
    chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => {
      chrome.sidePanel.close({tabId: tabs[0].id})
    })
  }
  catch(e){
    // ignore error
  }
};