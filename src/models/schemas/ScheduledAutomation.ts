import { getUtcNow } from '../../utilities/transformers';
import { ChangeDetection } from '../../types';

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
  onlySaveOnChange: boolean;
  lastRanOn: number | null;
  lastError: string | null;

  constructor() {
    this.uuid = crypto.randomUUID();
    this.unit = 'count';
    this.value = 100;
    this.keepTabOpen = false;
    this.createdOn = getUtcNow();   // matches type Date
    this.active = true;
    this.isDeepSave = true;
    this.changeDetectors = [];
    this.onlySaveOnChange = false;
    this.lastRanOn = null;
    this.runInServiceWorker = false;
    this.lastError = null
    this.crontab = '* * * * * *';
  }
}