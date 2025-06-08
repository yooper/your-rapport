/**
 * Used for tracking the bulk collection objects
 */
import { createTab, getActiveTab, sleep } from '../../utilities/loaders';
import { updateRecord } from '../db/local';
import { BULK_AUTOMATION, UUID } from '../../services/constants';

export class BulkAutomationUrl {
  constructor(
    uuid,
    url,
    unit,
    value,
    screenShotsCollected = 0,
    createdOn = Date.now(),
    keepTabOpen = true,
    ranOn = null,
    completedOn = null,
    description = null
  ) {
    this.uuid = uuid;
    this.url = url;
    this.unit = unit;
    this.value = value;
    this.screenShotsCollected = screenShotsCollected;
    this.keepTabOpen = keepTabOpen
    this.createdOn = createdOn;
    this.ranOn = ranOn;
    this.completedOn = completedOn;
    this.description = description
    this.tabId = null;
  }

  /**
   * Initiate the automation
   * @param automation
   * @returns {Promise<void>}
   */
  static async run(automation){
    await createTab(automation.url);
    await sleep( 4000); // TODO: Make this a configuration value, allows for page to full load
    automation.ranOn = Date.now();
    await updateRecord(BULK_AUTOMATION, UUID, automation);
    const activeTab = await getActiveTab();
    chrome.tabs.sendMessage(activeTab.id, {cmd: 'startCapture', automation: automation})
  }
}
