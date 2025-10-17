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
};

export type Participants = {
  to?: string;
  bcc?: string;
  cc?: string;
  from?: string;
};

export interface ICreatedBy {
  createdBy: string;
  createdOn: Date;
}

export interface IUpdatedBy {
  updatedBy: string;
  updatedOn: Date;
}

export interface IDeletedBy {
  deletedBy?: string;
  deletedOn?: Date;
}

export type Temporal = {
  startedOn?: Date;
  endedOn?: Date;
  timeZone?: string;
};

export type Spatial = {
  distanceUnit?: string;
  distance?: number;
  latitude?: number;
  longitude?: number;
  radius?: number;
};

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
  screenshot?: string | null;
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

export type CaseManagement = ICreatedBy &
  IUpdatedBy & {
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
  };

export type SourcedFrom = {
  url: string;
  domain: string;
  title?: string;
};

export interface INameOnly {
  name: string;
}

export type SelectorType = INameOnly & {
  name: string;
};

export type Domain = INameOnly & {
  name: string;
};

export type Url = INameOnly & {
  name: string;
};

export type Tag = INameOnly & {
  name: string;
};

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
};

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

interface DiscoveryPluginRecord {
  label?: string;
  url?: string;
  action?: PluginAction;
  eventType?: EventType;
  pluginType?: string;
  [key: string]: any;
}

interface DiscoveryPluginBasicFormProps {
  record: DiscoveryPluginRecord;
  setRecord: (
    updater: (prev: DiscoveryPluginRecord) => DiscoveryPluginRecord
  ) => void;
  pluginTypes: string[];
  setPluginTypes: (types: string[]) => void;
}

type HeaderRow = {
  keyName?: string;
  mappedFieldName?: string;
};

interface RecordWithHeaders {
  headers?: Record<string, string>;
  [key: string]: any;
}

interface HeaderMappingFormProps {
  record: RecordWithHeaders;
  setRecord: (updater: (prev: RecordWithHeaders) => RecordWithHeaders) => void;
}

interface RecordType {
  groupName?: string;
  homePage?: string;
  supportPage?: string;
  version?: string;
  [key: string]: any;
}

interface GroupHomeSupportFormProps {
  record: RecordType;
  setRecord: (updater: (prev: RecordType) => RecordType) => void;
}

type FieldRow = {
  keyName?: string;
  mappedFieldName?: string;
};

interface APIKey {
  Key: string;
}

interface RecordWithFieldMapping {
  fieldMapping?: Record<string, string>;
  [key: string]: any;
}

interface FieldMappingFormProps {
  record: RecordWithFieldMapping;
  setRecord: (
    updater: (prev: RecordWithFieldMapping) => RecordWithFieldMapping
  ) => void;
  apiKeys?: APIKey[]; // Not used here directly but left in case future implementation
}

type PluginAction =
  | 'CreateTab'
  | 'SubmitForm'
  | 'ForegroundRunner'
  | 'BackgroundRunner';
type EventType =
  | 'preCreate'
  | 'postCreate'
  | 'preUpdate'
  | 'postUpdate'
  | 'preDelete'
  | 'postDelete';

interface DiscoveryPluginRecord {
  label?: string;
  url?: string;
  action?: PluginAction;
  eventType?: EventType;
  pluginType?: string;
  [key: string]: any;
}

interface DiscoveryPluginBasicFormProps {
  record: DiscoveryPluginRecord;
  setRecord: (
    updater: (prev: DiscoveryPluginRecord) => DiscoveryPluginRecord
  ) => void;
  pluginTypes: string[];
  setPluginTypes: (types: string[]) => void;
}

type DiscoveryPluginAdvancedFormProps = {
  record: {
    method?: string;
    contentTypeHeader?: string;
    authorizationBearerToken?: string;
    authorizationUserName?: string;
    authorizationPassword?: string;
    [key: string]: any;
  };
  setRecord: (updater: (prev: any) => any) => void;
};

type DiscoveryPluginAdvancedFormProps = {
  record: {
    method?: string;
    contentTypeHeader?: string;
    [key: string]: any;
  };
  setRecord: (updater: (prev: any) => any) => void;
};
