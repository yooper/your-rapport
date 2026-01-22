import { Configuration } from './Configuration';
import { IRapport, ISelector } from '../../types';
import { db } from '../db/dexieDb';
import { findAllMatches, getUtcNow } from '../../utilities/transformers';
import { SelectorSchema } from '../validators/Selector.validator';
import { debug } from '../../services/logger_services';
import { Rapport } from './Rapport';
import { Tag } from './Tag';

/**
 * Represents a single Selector used for tagging or filtering records.
 */
export class Selector implements ISelector {
  name: string;
  selectorTypeName: string;
  description: string | null;
  count: number;
  active: boolean;
  tags: Tag[];

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
    this.tags = []
  }

  /**
   * Add a selector and update existing records with matches.
   * @param selector Selector
   */
  static async add(selector: Selector): Promise<void> {
    try{
      selector.name = selector.name.toLowerCase().trim();
      await db.selector.add(selector);
      const rapports: any[] = await db.rapport.orderBy('updatedOn').reverse().toArray() ?? [];
      await Selector.findAndAssignMatches(rapports, [selector]);
      await db.rapport.bulkPut(rapports);
      const configuration = await Configuration.getConfiguration();
      configuration.updatedOn = getUtcNow();
      await Configuration.setConfiguration(configuration);
    }
    catch(e){
      // silence duplicate errors
      await debug(String(e));
    }
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

    const rapports: Rapport[] = await db.rapport.orderBy('updatedOn').reverse().toArray() ?? [];
    for (let rapport of rapports) {
      rapport.selectors = rapport.selectors.filter(s => !names.includes(s.name));
    }
    // re-save the rapport records
    await db.rapport.bulkPut(rapports);
    const configuration = await Configuration.getConfiguration();
    configuration.updatedOn = getUtcNow();
    await Configuration.setConfiguration(configuration);
  }

  /**
   *
   * @param rapports
   * @param selectors
   */
  static async findAndAssignMatches(
    rapports: IRapport[],
    selectors: Selector[]
  ): Promise<IRapport[]> {
    for (const rapport of rapports) {
      rapport.selectors = findAllMatches(
        rapport.text + (rapport.note ?? '') + (rapport.title ?? '') + (rapport.url ?? ''),
        selectors,
        1
      ).concat(rapport.selectors ?? []);
    }

    const configuration = await Configuration.getConfiguration();
    configuration.updatedOn = getUtcNow();
    await Configuration.setConfiguration(configuration);
    return rapports;
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
