/**
 * Used for tracking the bulk collection objects
 */
import { getLocalItem, updateRecord } from '../db/local';
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
    pageId = null,
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
    this.description = description;
    this.active = false;
    this.tabId = null;
    this.tab = null;
    this.pageId = null;
  }

  static async getActiveAutomation(){
    const automationQueue = await getLocalItem(BULK_AUTOMATION);
    const activeAutomation = automationQueue.find(a => a.active);
    return activeAutomation;
  }

  static async getNextAutomation(){
    const automationQueue = await getLocalItem(BULK_AUTOMATION);
    const activeAutomation = automationQueue.find(a => !a.ranOn);
    if(!activeAutomation){
      return null;
    }
    activeAutomation.ranOn = Date.now();
    activeAutomation.active = true;
    await updateRecord(BULK_AUTOMATION, UUID, activeAutomation);
    return activeAutomation;
  }


}
