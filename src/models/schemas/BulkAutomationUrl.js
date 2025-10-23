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
  }

  /**
   *
   * @returns {Promise<BulkAutomationUrl|null>}
   */
  static async getActiveAutomation() {
    const automationQueue = await getLocalItem(BULK_AUTOMATION);
    const activeAutomation = automationQueue.find((a) => a.active);
    return activeAutomation
      ? BulkAutomationUrl._getInstance(activeAutomation)
      : null;
  }

  /**
   * Internal function for returning an instance
   * @param obj
   * @returns {BulkAutomationUrl}
   * @private
   */
  static _getInstance(obj) {
    const instance = new BulkAutomationUrl();
    Object.assign(instance, obj);
    return instance;
  }

  static async getAndSetNextAutomation() {
    const automationQueue = await getLocalItem(BULK_AUTOMATION);
    const activeAutomation = automationQueue.find((a) => !a.ranOn);
    if (!activeAutomation) {
      return null;
    }

    activeAutomation.ranOn = Date.now();
    activeAutomation.active = true;
    await updateRecord(BULK_AUTOMATION, UUID, activeAutomation);
    return activeAutomation
      ? BulkAutomationUrl._getInstance(activeAutomation)
      : null;
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
