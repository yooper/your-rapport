import { getUtcNow } from '../../utilities/transformers';
import { ChangeDetection } from '../../types';
import { DiscoveryPlugin } from './DiscoveryPlugin';
import { db } from '../db/dexieDb';

export class ScheduledAutomation {
  uuid: string;
  url!: string;
  unit: 'count' | 'time';
  value: number;
  keepTabOpen: boolean;
  createdOn: number;
  active: boolean;
  isDeepSave: boolean;
  crontab: string
  runInServiceWorker: boolean;
  changeDetectors: ChangeDetection[];
  enableImageChangeDetector: boolean;
  enableSelectorChangeDetector: boolean;
  onlySaveOnChange: boolean;
  lastRanOn: number | null;
  lastError: string | null;
  discoveryPlugin: DiscoveryPlugin | null;
  tags: string[];

  constructor() {
    this.uuid = crypto.randomUUID();
    this.unit = 'count';
    this.value = 100;
    this.keepTabOpen = false;
    this.createdOn = getUtcNow();   // matches type Date
    this.active = true;
    this.isDeepSave = true;
    this.changeDetectors = [];
    this.onlySaveOnChange = true;
    this.enableImageChangeDetector = true;
    this.enableSelectorChangeDetector = true;
    this.lastRanOn = null;
    this.runInServiceWorker = false;
    this.lastError = null
    this.crontab = '0 * * * * *';
    this.discoveryPlugin = null;
    this.tags = []
  }

  static async addMonitor(url: string){
    const scheduledAutomation = new ScheduledAutomation();
    scheduledAutomation.url = url;
    scheduledAutomation.crontab = '0 * * * * *';
    await db.scheduledAutomation.add(scheduledAutomation);
  }

}