import Dexie, { Entity, type EntityTable } from 'dexie';
import { CaseManagement, Domain, FileMetadata, IRapport, Selector, SelectorType, Tag, Url } from '../../types';
import { BulkAutomationUrl } from '../schemas/BulkAutomationUrl';


const db = new Dexie('YourRapport') as Dexie & {
  rapport: EntityTable<IRapport, 'id'>;
  selector: EntityTable<Selector, 'name'>;
  selectorType: EntityTable<SelectorType, 'name'>;
  tag: EntityTable<Tag, 'name'>;
  caseManagement: EntityTable<CaseManagement, 'id'>;
  domain: EntityTable<Domain, 'name'>;
  url: EntityTable<Url, 'name'>;
  attachment: EntityTable<FileMetadata, 'id'>;
  bulkAutomation: EntityTable<BulkAutomationUrl, 'id'>;


}
  db.version(1).stores({
      rapport: `
        @id,        
        caseManagementUuid,
        createdBy, createdOn,
        updatedBy, updatedOn,
        deletedBy, deletedOn,
        startedOn, endedOn, timeZone,
        address, address2, city, country, postalCode, region,
        to, from,
        mimeType,
        url, domain, title, 
        relevance, note, visibleText,
        latitude, longitude,
        isImportant, isValidatedSource, *selectors, *tags
      `,
      selector: 'id++, key, selectorTypeName',
      tag: '&name',
      caseManagement: '@id, &name',
      domain: '&name',
      url: '&name',
      selectorType: '&name',
      attachment: '@id, rapportId, ',
      bulkAutomation: `@id, url, active, createdOn`
    });


export { db };