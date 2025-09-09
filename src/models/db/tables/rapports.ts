// db/tables/rapports.ts

import { Table } from 'dexie';

export type Rapport = {
  accessed: number;
  address?: string;
  address2?: string;
  attributesJson: string;
  bcc?: string;
  cachedNodesJson?: string;
  cachedSelectorsJson?: string;
  cachedTagsJson?: string;
  caseManagementUuid: string;
  cc?: string;
  city?: string;
  contentTypeId: number;
  country?: string;
  createdBy: string;
  createdOn: Date;
  data?: Uint8Array;
  deletedBy?: string;
  deletedOn?: Date;
  description?: string; // if you add it
  distanceUnit?: string;
  domainId: number;
  endedOn?: Date;
  from?: string;
  hash?: string;
  hashAlgorithm: string;
  isImportant: boolean;
  isValidatedSource: boolean;
  latitude?: number;
  level: number;
  longitude?: number;
  mimeType: string;
  note?: string;
  parentUuid?: string;
  postalCode?: string;
  radius?: number;
  rawHtml?: string;
  referrer?: string;
  region?: string;
  relevance: string;
  rootUuid?: string;
  screenShot?: string;
  size: number;
  sortOrder: number;
  sourcedFrom?: string;
  startedOn?: Date;
  timeZone?: string;
  title?: string;
  to?: string;
  updatedBy?: string;
  updatedOn: Date;
  urlId: number;
  uuid: string;
  visibleText?: string;
};

export type RapportsTable = {
  rapports: Table<Rapport>;
};

export const rapportsSchema = {
  rapports: '++id, name, age'
};