import { INameOnly } from '../../types';
import { db } from '../db/dexieDb';
import { getLocalItem, setLocalItem } from '../db/local';
import { RAPPORT } from '../../services/constants';
import { Configuration } from './Configuration';
import { getUtcNow } from '../../utilities/transformers';

export class Tag implements INameOnly {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  /**
   * Remove one or more tags and strip it from existing records.
   * @param value Tag | Array<Tag>
   */
  static async delete(value: Tag | Array<Tag>): Promise<void> {
    let names: string[] = [];
    if (Array.isArray(value)) {
      names = value.map((tag) => tag.name);
      await db.tag.bulkDelete(names);
    } else {
      await db.tag.where('name').equals(value.name).delete();
      names.push(value.name);
    }

    const records: any[] = await db.rapport.toArray() ?? [];
    for (let record of records) {
      record.tags = records.tags?.filter((tag) => !names.includes(tag.name));
    }
    // re-save the rapport records
    await setLocalItem(RAPPORT, records);
    const configuration = await Configuration.getConfiguration();
    configuration.updatedOn = getUtcNow();
    await Configuration.setConfiguration(configuration);
  }
}
