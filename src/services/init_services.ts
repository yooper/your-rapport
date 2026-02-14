/**
 * Disabled because it is buggy
 */
import { debug } from './logger_services';

export const initExtensionPage = (): void => {
  try{
    chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => {
    let gettingContextInfo = chrome.runtime.getContexts({ contextTypes: ['SIDE_PANEL']});
    gettingContextInfo.then(contexts => {
      contexts.forEach(c => {
        if(c.tagId == tabs[0].id){
          chrome.sidePanel.close({tabId: tabs[0].id})
        }
      })

    });
    })
  }
  catch(e){
    debug('initExtensionPage:error', e)
  }
};


