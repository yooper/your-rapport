import Dexie, { type EntityTable } from 'dexie';
import { Selector } from './tables/selectors';


const db = new Dexie('YourRapport') as Dexie & {
  selectors: EntityTable<Selector, 'key'>
};

// Schema declaration:
db.version(1).stores({
  selectors: 'key, selectorTypeName, description, count, active'
});

export type { Selector };
export { db };