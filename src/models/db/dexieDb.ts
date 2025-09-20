import Dexie, { type EntityTable } from 'dexie';
import { Domain, SelectorType, Tag, Url } from '../../types';
import { Selector } from '../schemas/Selector';


const db = new Dexie('YourRapport') as Dexie & {
  selector: EntityTable<Selector, 'name'>;
  selectorType: EntityTable<SelectorType, 'name'>;
  tag: EntityTable<Tag, 'name'>;
  domain: EntityTable<Domain, 'name'>;
  url: EntityTable<Url, 'name'>;
}
  db.version(1).stores({
      selector: 'name, selectorTypeName',
      tag: '&name',
      domain: '&name',
      url: '&name',
      selectorType: '&name',
    });

export { db };