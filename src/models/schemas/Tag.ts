import { INameOnly } from '../../types';
import { db } from '../db/dexieDb';
import { getLocalItem, setLocalItem } from '../db/local';
import { CONFIGURATION, RAPPORT, UPDATED_ON } from '../../services/constants';

export class Tag implements INameOnly{
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  /**
   * Remove one or more tags and strip it from existing records.
   * @param value Tag | Array<Tag>
   */
  static async delete(value: Tag | Array<Tag>): Promise<void> {
    let names: string[] = []
    if(Array.isArray(value)){
      names = value.map(tag => tag.name)
      await db.tag.bulkDelete(names);
    }
    else{
      await db.tag.where('name').equals(value.name).delete();
      names.push(value.name);
    }

    const records: any[] = (await getLocalItem(RAPPORT)) ?? [];
    for (let record of records) {
      record.tags = records.tags?.filter(tag => !names.includes(tag.name));
    }
    // re-save the rapport records
    await setLocalItem(RAPPORT, records);
    const configuration = await getLocalItem(CONFIGURATION);
    configuration[UPDATED_ON] = Date.now().toString();
    await setLocalItem(CONFIGURATION, configuration);
  }
}