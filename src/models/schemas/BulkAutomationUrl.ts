import { IBulkAutomationRecord } from '../../types';
import { ScheduledAutomation } from './ScheduledAutomation';
import { DiscoveryPlugin } from './DiscoveryPlugin';

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
  discoveryPlugin: DiscoveryPlugin | null;
  failReason: string | null;
  attempts: number;
  leaseUntil: number | null;
  status: 'queued' | 'running' | 'done' | 'failed';
  scheduledAutomation: ScheduledAutomation | null;

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
    this.discoveryPlugin = null;
    this.failReason = null;
    this.attempts = 0;
    this.leaseUntil = null;
    this.status = 'queued';
    this.scheduledAutomation = null;
  }

  static createBulkAutomationJob(
    url: string,
    options?: {
      keepTabOpen?: boolean;
      isDeepSave?: boolean;
      discoveryPlugin?: DiscoveryPlugin | null;
      description?: string | null;
      unitDefault: 'count' | 'time';
      valueDefault: number,
      scheduledAutomation: ScheduledAutomation | null
    }): BulkAutomationUrl {
    const job = new BulkAutomationUrl();
    job.url = url;
    job.unit = options?.unitDefault ?? 'count';
    job.value = options?.valueDefault ?? 100;
    job.active = false;
    job.keepTabOpen = options?.keepTabOpen ?? true;
    job.isDeepSave = options?.isDeepSave ?? false;
    job.discoveryPlugin = options?.discoveryPlugin ?? null;
    job.description = options?.description ?? null;
    job.scheduledAutomation = options?.scheduledAutomation ?? null;
    if(!job.discoveryPlugin && job.scheduledAutomation?.discoveryPlugin){
      job.discoveryPlugin = job.scheduledAutomation?.discoveryPlugin
    }
    job.status = 'queued';
    return job;
  }
}