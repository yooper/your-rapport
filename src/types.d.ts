export type Selector = {
  name: string;
  selectorTypeName: string;
  description: string | null;
  count: number;
  active: boolean;
};


export type Address = {
  address?: string;
  address2?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  region?: string;
}

export type Participants = {
  to?: string
  bcc?: string;
  cc?: string;
  from?: string
}

export interface ICreatedBy {
  createdBy: string
  createdOn: Date;
}

export interface IUpdatedBy {
  updatedBy: string
  updatedOn: Date;
}

export interface IDeletedBy {
  deletedBy?: string
  deletedOn?: Date;
}

export type Temporal = {
  startedOn?: Date;
  endedOn?: Date;
  timeZone?: string;
}


export type Spatial = {
  distanceUnit?: string;
  distance?: number;
  latitude?: number;
  longitude?: number;
  radius?: number;
}


// Combine everything into a single data shape
export interface IRapport
  extends IUpdatedBy,
    ICreatedBy,
    IDeletedBy,
    Temporal,
    Spatial,
    Address,
    Participants,
    SourcedFrom {
  id: string;
  accessed: number;
  caseManagementUuid: string;
  isImportant: boolean;
  isValidatedSource: boolean;
  note?: string | null;
  referrer?: string | null;
  relevance: string | 'low';
  text?: string;
  selectors: Array<Selector>;
  tags: Array<string>;
  artifacts: Array<Attachment>;
  extractedUrls: Array<string>;
  extractedDomains: Array<string>;
}

export type CaseManagement = ICreatedBy & IUpdatedBy & {
  id: string;
  name: string;
  note?: string;
  caseWorkerName?: string;
  caseNumber?: string;
  createdBy: string;
  createdOn: Date;
  updatedBy?: string;
  updatedOn?: Date;
  profileName?: string;
  profileImage?: string;
  attributes?: Record<string, any>;
}

export type SourcedFrom = {
  url: string;
  domain: string
  title?: string
}

export interface INameOnly{
  name: string
}

export type SelectorType = INameOnly & {
  name: string
}

export type Domain = INameOnly & {
  name: string
}

export type Url = INameOnly & {
  name: string
}

export type Tag = INameOnly & {
  name: string
}

export interface IArtifact {
  id?: string; // UUID string, primary key
  rapportUuid: string; // pointer to rapport record this attachment originated from
  size: number;
  hash: string;
  hashAlgorithm: string;
  mimeType: string;
  data: Blob;
  url: string;
}

/**
 * Lightweight version of Artifact
 */
export type Attachment = {
  id: string;
  mimeType: string;
  size: number;
  url: string;
}

/**
 * Api Response from the api.html endpoint page
 */
interface APIResponse {
  success: boolean;
  data?: any;
  error?: string;
}

type Props = {
  /** auto-run on mount */
  autoRun?: boolean;
  /** spaces for JSON.stringify formatting */
  pretty?: number;
  /** pass-through className for styling */
  className?: string;
};

