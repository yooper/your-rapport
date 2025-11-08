import {
  addRecord,
  deleteRecord,
  getLocalItem,
  setLocalItem,
  updateRecord,
} from '../db/local';
import {
  CONFIGURATION,
  RAPPORT,
  SELECTOR,
  UPDATED_ON,
  UUID,
} from '../../services/constants';
import { Configuration } from './Configuration';
import { ISelector } from '../../types';
import { db } from '../db/dexieDb';
import { findAllMatches } from '../../utilities/transformers';
import { DiscoveryPluginSchema } from '../validators/DiscoveryPlugin.validator';
import { SelectorSchema } from '../validators/Selector.validator';

/**
 * Represents a single Selector used for tagging or filtering records.
 */
export class Selector implements ISelector {
  name: string;
  selectorTypeName: string;
  description: string | null;
  count: number;
  active: boolean;

  constructor(
    name: string,
    selectorTypeName: string,
    description: string | null = null,
    active: boolean = true
  ) {
    this.name = name;
    this.selectorTypeName = selectorTypeName;
    this.description = description;
    this.count = 0;
    this.active = active;
  }

  /**
   * Add a selector and update existing records with matches.
   * @param selector Selector
   */
  static async add(selector: Selector): Promise<void> {
    selector.name = selector.name.toLowerCase().trim();
    await db.selector.add(selector);
    const records: any[] = (await getLocalItem(RAPPORT)) ?? [];
    await Selector.findAndAssignMatches(records, [selector]);
    await Configuration.setConfigurationValue(UPDATED_ON, Date.now());
  }

  /**
   * Remove a selector and strip it from existing records.
   * @param value Selector | Array<Selector>
   */
  static async delete(value: Selector | Array<Selector>): Promise<void> {
    let names: string[] = [];
    if (Array.isArray(value)) {
      names = value.map((selector) => selector.name);
      await db.selector.bulkDelete(names);
    } else {
      await db.selector.delete(value.name);
      names.push(value.name);
    }

    const records: any[] = (await getLocalItem(RAPPORT)) ?? [];
    for (let record of records) {
      record.selectors = record.selectors.filter(s => !names.includes(s.name));
    }
    // re-save the rapport records
    await setLocalItem(RAPPORT, records);
    const configuration = await getLocalItem(CONFIGURATION);
    configuration[UPDATED_ON] = Date.now().toString();
    await setLocalItem(CONFIGURATION, configuration);
  }

  /**
   * Assign matching selectors to records based on their content.
   * @param records Array of records
   * @param selectors Array of Selector objects
   */
  static async findAndAssignMatches(
    records: any[],
    selectors: Selector[]
  ): Promise<void> {
    for (const record of records) {
      record.selectors = findAllMatches(
        record.text + (record.note ?? ''),
        selectors,
        1
      ).concat(record.selectors ?? []);
      await updateRecord(RAPPORT, UUID, record);
    }

    const configuration = await getLocalItem(CONFIGURATION);
    configuration[UPDATED_ON] = Date.now().toString();
    await setLocalItem(CONFIGURATION, configuration);
  }

  static validate(input: unknown)
  {
      const res = SelectorSchema.safeParse(input);
      if (!res.success) {
        return { ok: false, errors: res.error.issues.map(i => `${i.path.join(".") || "(root)"}: ${i.message}`+ "   ") };
      }
      return { ok: true, data: res.data };
  }

}
