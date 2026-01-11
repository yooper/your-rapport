import BulkAutomationUrl from './BulkAutomationUrl';

class ScheduleAutomation {
  uuid: string;
  url: string|null;
  unit: 'count' | 'time';
  value: number;
  keepTabOpen: boolean;
  createdOn: Date;
  active: boolean;
  isDeepSave: boolean;
  crontab: string|null;


  constructor() {
    this.uuid = crypto.randomUUID();
    this.url = null;
    this.unit = 'count';
    this.value = 0;
    this.keepTabOpen = false;
    this.createdOn = new Date();   // matches type Date
    this.active = true;
    this.isDeepSave = false;
    this.crontab = null;
  }
}