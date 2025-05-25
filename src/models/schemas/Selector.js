import {
  addRecord,
  deleteRecord,
  getLocalItem,
  setLocalItem,
  updateRecord,
} from '../db/local';
import { findAllMatches } from '../../utilities/transformers';

export class Selector {
  constructor(key, selectorTypeName, description = null) {
    this.key = key;
    this.selectorTypeName = selectorTypeName;
    this.description = description;
    this.count = 0;
  }

  /**
   * @param {Selector}selector
   * @returns {Promise<void>}
   */
  static async add(selector) {
    // normalize selector to lower case
    selector.key = selector.key.toLowerCase().trim();
    await addRecord('selectors', 'key', selector);
    // scan the existing records
    let records = (await getLocalItem('rapports')) ?? [];
    await Selector.findAndAssignMatches(records, [selector]);
  }

  /**
   *
   * @param {Selector}selector
   * @returns {Promise<void>}
   */
  static async delete(selector) {
    await deleteRecord('selectors', 'key', selector);
    let records = (await getLocalItem('rapports')) ?? [];
    for (let record of records) {
      record.selectors = record.selectors.filter(
        (item) => item.key === selector.key
      );
    }
    await setLocalItem('rapports', records);
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
      await updateRecord('rapports', 'uuid', record);
    }

    const configurationRegistry = await getLocalItem('configuration');
    configurationRegistry.lastSavedOn = Date.now().toString();
    await setLocalItem('configuration', configurationRegistry);
  }
}
