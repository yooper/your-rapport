import { IRapport, RapportFileMeta, Selector } from '../../types';
import { findAllMatches } from '../../services/search_engine_service';
import { sha256 } from '../../utilities/transformers';

export class Rapport implements IRapport {
  id: number;
  // Fields from IRapport
  uuid: string;
  createdBy: string;
  createdOn: Date | undefined;
  updatedBy: string;
  updatedOn: Date;
  deletedBy: string;
  deletedOn: Date;
  startedOn?: Date;
  endedOn?: Date;
  timeZone?: string;
  distanceUnit?: string;
  distance?: number;
  latitude?: number;
  longitude?: number;
  radius?: number;
  parentUuid?: string;
  rootUuid?: string;
  level: number = 0;
  address?: string;
  address2?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  region?: string;
  to?: string;
  bcc?: string;
  cc?: string;
  from?: string;
  size: number = 0;
  hash: string;
  hashAlgorithm: string;
  mimeType: string;
  url: string;
  domain: string;
  title?: string;
  accessed: number = 0;
  caseManagementUuid: string = '30583002-f730-4383-bf28-fdd8aadcf387';
  isImportant: boolean = false;
  isValidatedSource: boolean = false;
  note?: string;
  referrer?: string;
  relevance: string = 'low';
  screenShot?: string;
  length: number = 0;
  text?: string;
  attachments: RapportFileMeta[] = [];
  bulkAutomationUuid?: string;
  createdOnLocalTime: Date;
  sequenceId: number = 0;

  constructor(init: IRapport) {
    Object.assign(this, init);
  }

  static async createFromTab(tab: any, text: string, screenShot: string, selectors: Array<Selector>) {
    const createdOn = new Date();
    const hash = await sha256(screenShot);
    const domain = new URL(tab.url).hostname;
    const matchedSelectors = findAllMatches(text, selectors, 1);

    return new Rapport({
      title: tab.title,
      url: tab.url,
      domain,
      text,
      screenshot: screenShot,
      createdOn,
      updatedOn: createdOn,
      createdOnLocalTime: new Date().toLocaleString(),
      hash,
      createdBy: 'TODO-CREATE', // Requires auth system
      updatedBy: 'TODO-UPDATE', // Requires auth system
      length: screenShot.length,
      attributes: { tab },
      selectors: matchedSelectors,
      tags: [], // Placeholder for future tagging
      caseManagementUuid: '30583002-f730-4383-bf28-fdd8aadcf387',
      attachments: [],
      note: null
    });
  }
}
