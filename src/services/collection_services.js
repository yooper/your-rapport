import { getActiveTab } from '../utilities/loaders';
import { waitForPageInfo } from '../backgrounds/automation-runner';
import { capture } from '../datasources/browser_capture';


/**
 * Reusable function for capturing the 1st screenshot.
 * @returns {Promise<void>}
 */
export async function captureSingleScreenShot(deepSave = false) {

  const activeTab = await getActiveTab();
  const pageInfo = await waitForPageInfo(activeTab.id);
  await capture(activeTab, pageInfo, deepSave);

}
