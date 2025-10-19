import React from 'react';
import { DiscoveryPluginAction } from './models/schemas/DiscoveryPlugin';

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
}

interface IApiKey{
  key: string
  value: string
}

interface DiscoveryPluginLayoutProps extends  DiscoveryPluginFormProps{
  apiKeys: IApiKey[];
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
}

export type DiscoveryPluginAction =
  | 'BackgroundRunner'
  | 'CreateTab'
  | 'ForegroundRunner'
  | 'SubmitForm';

