import Dexie, { type EntityTable } from 'dexie';
import { Domain, SelectorType, Tag, Url } from '../../types';
import { Selector } from '../schemas/Selector';
import { Artifact } from '../schemas/Artifact';

const db = new Dexie('YourRapport') as Dexie & {
  selector: EntityTable<Selector, 'name'>;
  selectorType: EntityTable<SelectorType, 'name'>;
  tag: EntityTable<Tag, 'name'>;
  domain: EntityTable<Domain, 'name'>;
  url: EntityTable<Url, 'name'>;
  artifact: EntityTable<Artifact, 'uuid'>;
  discoveryPlugin: EntityTable<Artifact, 'uuid'>
};
db.version(1).stores({
  selector: '&name, selectorTypeName',
  tag: '&name',
  domain: '&name',
  url: '&name',
  selectorType: '&name',
});
db.version(2).stores({
  artifact: '&uuid, rapportUuid',
});
db.version(3).stores({
  apiKey: 'id++, &key',
  discoveryPlugin: '&uuid, &label, pluginType',
});

export { db };
