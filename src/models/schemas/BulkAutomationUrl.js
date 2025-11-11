/**
 * Used for tracking the bulk collection objects
 */
import { addRecord, getLocalItem, updateRecord } from '../db/local';
import { BULK_AUTOMATION, UUID } from '../../services/constants';
import { Configuration } from './Configuration';

export default class BulkAutomationUrl {
  constructor() {
    this.uuid = crypto.randomUUID();
    this.url = null;
    this.unit = null;
    this.value = null;
    this.screenShotsCollected = 0;
    this.keepTabOpen = false;
    this.createdOn = Date.now();
    this.ranOn = null;
    this.completedOn = null;
    this.description = null;
    this.active = false;
    this.tabId = null;
    this.tab = null;
    this.isDeepSave = false
    // optional discovery plugin to use for configuring the
    this.discoveryPluginUuid = null;
  }


  static async getAndSetNextAutomation() {
    const automationQueue = await getLocalItem(BULK_AUTOMATION);
    automationQueue.forEach(a => a.active = false);
    const activeAutomation = automationQueue.find(a => !a.ranOn && !a.completedOn)
    if (!activeAutomation) {
      await updateRecord(BULK_AUTOMATION, UUID, activeAutomation);
      return null;
    }
    else{
      activeAutomation.active = true;
      activeAutomation.ranOn = new Date();
      await updateRecord(BULK_AUTOMATION, UUID, activeAutomation);
      return activeAutomation;
    }
  }

  /**
   * Add the url to the queue
   * TODO: implement deepSave conditions
   * @param url
   * @param {boolean} isDeepSave is false by default
   *
   * @returns {Promise<void>}
   */
  static async queueUrl(url, isDeepSave = false){
    const unitDefault = await Configuration.getConfigurationValue(
      'automationUnitDefault',
      'count'
    );
    const valueDefault = await Configuration.getConfigurationValue(
      'automationValueDefault',
      100
    );
    const automation = {
      uuid: crypto.randomUUID(),
      url: url,
      createdOn: Date.now(),
      completedOn: null,
      ranOn: null,
      unit: unitDefault,
      value: valueDefault,
      keepTabOpen: true,
      screenShotsCollected: 0,
      isDeepSave: isDeepSave
    };
    await addRecord(BULK_AUTOMATION, UUID, automation);
  }
}
