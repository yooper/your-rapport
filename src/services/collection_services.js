import { getActiveTab } from '../utilities/loaders';
import { getTabInfo } from '../utilities/PortManager';
import { capture } from '../datasources/browser_capture';
import { debug } from './logger_services';

/**
 * Reusable function for capturing the 1st screenshot.
 * @returns {Promise<void>}
 */
export async function captureSingleScreenShot(deepSave = false) {
  const activeTab = await getActiveTab();
  const pageInfo = getTabInfo();
  if (activeTab.id in pageInfo) {
    // TODO reduce duplicity of terms being used.
    await capture(activeTab, pageInfo[activeTab.id].pageInfo, deepSave);
  } else {
    debug(
      `Could not capture single screenshot, no active tab found with page info, is dev tools open?`,
      { activeTab }
    );
  }
}
