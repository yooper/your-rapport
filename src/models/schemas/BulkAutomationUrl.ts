/**
 * Used for tracking the bulk collection objects
 */
import { getLocalItem, updateRecord } from '../db/local';
import { BULK_AUTOMATION, UUID } from '../../services/constants';
import { ICreatedBy, IRapport } from '../../types';

export class BulkAutomationUrl implements ICreatedBy{
  id: string;
  url: string;
  unit?: string | null;
  value?: string | number | null;
  screenShotsCollected: number = 0;
  keepTabOpen: boolean = true
  ranOn?: number | null;
  completedOn?: number;
  description?: string;
  active: boolean = false;
  tabId?: number | null;
  tab?: chrome.tabs.Tab | null;
  createdBy: string;
  createdOn: Date

  constructor(init: Partial<BulkAutomationUrl>) {
    Object.assign(this, init);
  }


  /**
   * Returns the currently active automation (if any)
   */
  static async getActiveAutomation(): Promise<BulkAutomationUrl | null> {
    const automationQueue: BulkAutomationUrl[] = await getLocalItem(BULK_AUTOMATION);
    const activeAutomation = automationQueue.find((a) => a.active);
    return activeAutomation ? BulkAutomationUrl._getInstance(activeAutomation) : null;
  }

  /**
   * Internal helper to hydrate plain objects back into class instances
   */
  private static _getInstance(obj: Partial<BulkAutomationUrl>): BulkAutomationUrl {
    const instance = new BulkAutomationUrl(obj);
    return instance;
  }

  /**
   * Gets the next automation that hasn't been run, sets it active, and updates storage.
   */
  static async getAndSetNextAutomation(): Promise<BulkAutomationUrl | null> {
    const automationQueue: BulkAutomationUrl[] = await getLocalItem(BULK_AUTOMATION);
    const activeAutomation = automationQueue.find((a) => !a.ranOn);
    if (!activeAutomation) {
      return null;
    }

    activeAutomation.ranOn = Date.now();
    activeAutomation.active = true;
    await updateRecord(BULK_AUTOMATION, UUID, activeAutomation);
    return BulkAutomationUrl._getInstance(activeAutomation);
  }

}
