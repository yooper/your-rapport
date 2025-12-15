import React from 'react';
import { DiscoveryPlugin, DiscoveryPluginAction } from './models/schemas/DiscoveryPlugin';

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
  uuid: string;
  screenshot?: string | null;
  accessed: number;
  caseManagementUuid: string;
  isImportant: boolean;
  isValidatedSource: boolean;
  note?: string | null;
  referrer?: string | null;
  relevance: 'low' | 'medium' | 'high';
  isImportant: boolean | false;
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
  uuid: string; // UUID string, primary key
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
  uuid: string;
  mimeType: string;
  size: number;
  url: string;
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

/**
 * Gets passed around to all the Dicovery plugin forms
 */
interface DiscoveryPluginFormProps {
  record: DiscoveryPlugin;
  setRecord: (
    updater: (prev: DiscoveryPlugin) => DiscoveryPlugin
  ) => void;
  apiKeys: ApiKey[]
}

type ApiKey = {
  id: number
  key: string
  value: string|number|boolean|null
  pluginUuid: string|null;
}

interface DiscoveryPluginLayoutProps extends DiscoveryPluginFormProps{
  pluginTypes: string[];
  setPluginTypes: (types: string[]) => void;
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

export interface DiscoveryPluginInit {
  uuid?: string;
  pluginType?: string;
  url?: string;
  active?: boolean;
  groupName?: string;
  action?: DiscoveryPluginAction;
  homePage?: string | null;
  description?: string | null;
  label?: string;
  readOnly?: boolean;
  sortOrder?: number;
  timeOut?: number;
  lastAccessedOn?: Date | null;
  createdOn?: Date;
  timeTakenIn?: number;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  accessed?: number;
  version?: string;
  mimeTypeRegex?: string | null;
  status?: number | null;
  statusError?: string | null;
  contentTypeHeader?: string | null;
  fieldMapping?: Record<string, string>;
  headers?: Record<string, string>;
  selectorValue?: string | number | null;
  country?: string | null;
  onClick?: onClick | null // for use with plugins that require javascript to run/extend the functionality
  authorizationBearerToken?: string | null;
  authorizationUserName?: string | null;
  authorizationPassword?: string | null;
  script?: string | null;
  extractionRules?: any[] | [];
}


export type IBackgroundJob = {
  discoveryPlugin: DiscoveryPlugin,
  rapport: IRapport,
  bulkAutomationUrl: BulkAutomationUrl,
  status: 'queued'|'error'|'in progress'|'completed';
  startedOn: Date|null,
  details: string|null,
  completedOn: Date|null,
  type: 'DiscoveryPlugin'|'Rapport'|'BulkAutomation'
  createdOn: Date,
  selectorValue: string | number | null
};

export type onClick = (record: IRapport) => void;

export type DiscoveryPluginAction =
  | 'BackgroundRunner'
  | 'CreateTab'
  | 'ForegroundRunner'
  | 'SubmitForm';

export type NotificationPayload = {
  title?: string;
  message?: string;
  type?: 'success' | 'danger' | 'info' | 'default' | 'warning' | string;
  [k: string]: unknown;
};

interface HelperPopoverProps {
  message: string;
}

export interface PageInfo {
  uuid: string;
  title: string;
  contentType: string;
  html: string;
  url: string;
  screenShotCount: number;
  isAutomationBlockerDetected: boolean;
  visibleText: string;
  text: string;
  createdOn: number;
  tab: number | null;
  automation: IBulkAutomationRecord | null,
  sequence: number
}

export interface IBulkAutomationRecord {
  uuid: string;
  url: string;
  unit: 'count' | 'time';
  value: number;
  screenShotsCollected: number;
  keepTabOpen: boolean;
  createdOn: Date;
  ranOn: number | null;            // epoch ms or null
  completedOn: number | null;      // epoch ms or null
  description: string | null;
  active: boolean;
  tabId: number | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tab: any | null;
  isDeepSave: boolean;
  discoveryPluginUuid: string | null;
  status: 'queued' | 'running' | 'done' | 'failed';
  failReason: string | null;
  attempts: number;
  leaseUntil: number | null;
}

export type DiscoveryPluginAction =
  | 'BackgroundRunner'
  | 'CreateTab'
  | 'ForegroundRunner'
  | 'SubmitForm';

export type DiscoveryPluginRoute = 'inbound' | 'outbound';