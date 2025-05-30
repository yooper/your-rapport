import {
  addRecord,
  deleteRecord,
  getLocalItem,
  setLocalItem,
  updateRecord,
} from '../db/local';
import { findAllMatches } from '../../utilities/transformers';
import { CONFIGURATION, RAPPORT, SELECTOR, UPDATED_ON, UUID } from '../../services/constants';
import { Configuration } from './Configuration';

export class Selector {
  constructor(key, selectorTypeName, description = null, active = true) {
    this.key = key;
    this.selectorTypeName = selectorTypeName;
    this.description = description;
    this.count = 0;
    this.active = true;
  }

  /**
   * @param {Selector}selector
   * @returns {Promise<void>}
   */
  static async add(selector) {
    // normalize selector to lower case
    selector.key = selector.key.toLowerCase().trim();
    await addRecord(SELECTOR, 'key', selector);
    // scan the existing records
    let records = (await getLocalItem(RAPPORT)) ?? [];
    await Selector.findAndAssignMatches(records, [selector]);
    await Configuration.setConfigurationValue(UPDATED_ON, Date.now());
  }

  /**
   *
   * @param {Selector}selector
   * @returns {Promise<void>}
   */
  static async delete(selector) {
    await deleteRecord(SELECTOR, 'key', selector);
    let records = (await getLocalItem(RAPPORT)) ?? [];
    for (let record of records) {
      record.selectors = record.selectors.filter(
        (item) => item.key === selector.key
      );
    }
    await setLocalItem(RAPPORT, records);
  }

  /***
   * Iterate through the records looking for the given selectors
   * @param records
   * @param selectors
   * @returns {Promise<void>}
   * @private
   */
  static async findAndAssignMatches(records, selectors) {
    for (const record of records) {
      record.selectors = findAllMatches(record.text, selectors, 1).concat(
        record.selectors ?? []
      );
      await updateRecord(RAPPORT, UUID, record);
    }

    const configuration = await getLocalItem(CONFIGURATION);
    configuration[UPDATED_ON] = Date.now().toString();
    await setLocalItem(CONFIGURATION, configuration);
  }
}
