import { getUtc, getUtcNow } from '../../utilities/transformers';
import { ChangeDetection } from '../../types';
import { DiscoveryPlugin } from './DiscoveryPlugin';
import { db } from '../db/dexieDb';
import { debug } from '../../services/logger_services';
import { CronExpressionParser } from 'cron-parser';

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
  enableTextChangeDetector: boolean;
  onlySaveOnChange: boolean;
  prevRanOn: number | null;
  nextRunOn: number | null;
  lastError: string | null;
  discoveryPlugin: DiscoveryPlugin | null;
  tags: string[];
  caseManagementUuid: string;

  constructor() {
    this.uuid = crypto.randomUUID();
    this.unit = 'count';
    this.value = 100;
    this.keepTabOpen = false;
    this.createdOn = getUtcNow();
    this.active = true;
    this.isDeepSave = true;
    this.changeDetectors = [];
    this.onlySaveOnChange = true;
    this.enableImageChangeDetector = true;
    this.enableSelectorChangeDetector = true;
    this.enableTextChangeDetector = true;
    this.prevRanOn = null;
    this.nextRunOn = null;
    this.runInServiceWorker = false;
    this.lastError = null
    this.crontab = '0 0 * * * *';
    this.discoveryPlugin = null;
    this.tags = [];
    this.caseManagementUuid = "30583002-f730-4383-bf28-fdd8aadcf387"
  }

  /**
   * The default runs every minute
   * @param url
   * @param crontab
   */
  static async addMonitor(url: string, crontab: string = "0 * * * * *") {
    await debug("Scheduling an automation", { url, crontab });

    const scheduledAutomation = new ScheduledAutomation();
    scheduledAutomation.url = url;
    scheduledAutomation.crontab = crontab;
    const interval = CronExpressionParser.parse(crontab);

    if(interval.hasNext()){
      scheduledAutomation.nextRunOn = getUtc(interval.next().toDate());
    }

    await db.transaction("rw", db.scheduledAutomation, async () => {
      try {
        await db.scheduledAutomation.add(scheduledAutomation);
        await debug("addMonitor:completed", { scheduledAutomation });
      } catch (e) {
        await debug("addMonitor:error " + String(e), { scheduledAutomation });
        throw e;
      }
    });
  }
}