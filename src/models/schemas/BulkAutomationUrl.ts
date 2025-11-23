import { IBulkAutomationRecord } from '../../types';

export default class BulkAutomationUrl implements IBulkAutomationRecord {
  uuid: string;
  url: string;
  unit: 'count' | 'time';
  value: number;
  screenShotsCollected: number;
  keepTabOpen: boolean;
  createdOn: Date;
  ranOn: number | null;
  completedOn: number | null;
  description: string | null;
  active: boolean;
  tabId: number | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tab: any | null;
  isDeepSave: boolean;
  discoveryPluginUuid: string | null;
  failReason: string | null;
  attempts: number;
  leaseUntil: number | null;
  status: 'queued' | 'running' | 'done' | 'failed';

  constructor() {
    this.uuid = crypto.randomUUID();
    this.url = '';                 // default empty string
    this.unit = 'count';           // sane default
    this.value = 0;                // sane default
    this.screenShotsCollected = 0;
    this.keepTabOpen = false;
    this.createdOn = new Date();   // matches type Date
    this.ranOn = null;
    this.completedOn = null;
    this.description = null;
    this.active = false;
    this.tabId = null;
    this.tab = null;
    this.isDeepSave = false;
    this.discoveryPluginUuid = null;
    this.failReason = null;
    this.attempts = 0;
    this.leaseUntil = null;
    this.status = 'queued';
  }

  static createBulkAutomationJob(
    url: string,
    unitDefault: BulkAutomationUrl['unit'],   // 'count' | 'time'
    valueDefault: number,
    options?: {
      keepTabOpen?: boolean;
      isDeepSave?: boolean;
      discoveryPluginUuid?: string | null;
      description?: string | null;
    }): BulkAutomationUrl {
    const job = new BulkAutomationUrl();
    job.url = url;
    job.unit = unitDefault;
    job.value = valueDefault;
    job.active = false;
    job.keepTabOpen = options?.keepTabOpen ?? true;
    job.isDeepSave = options?.isDeepSave ?? false;
    job.discoveryPluginUuid = options?.discoveryPluginUuid ?? null;
    job.description = options?.description ?? null;
    job.status = 'queued';

    return job;
  }
}