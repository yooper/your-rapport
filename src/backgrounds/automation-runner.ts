// src/background/automation-runner.ts
import { takeNext, complete, fail, recoverExpiredLeases, getQueue } from './automation-queue';
import { debug } from '../services/logger_services';
import { capture } from '../datasources/browser_capture';
import { ACTIVATE_CAPTURE, PAGE_INFO, PAGE_INITIALIZED } from '../services/constants';
import { sleep } from '../utilities/loaders';
import  ExtensionPin from '../utilities/ExtensionPin';
import { CronExpressionParser } from 'cron-parser';
import { ScheduledAutomation } from '../models/schemas/ScheduledAutomation';
import { db } from '../models/db/dexieDb';
import BulkAutomationUrl from '../models/schemas/BulkAutomationUrl';
import { NoChangeDetectedError } from '../errors/NoChangeDetectedError';
import { Tag } from '../models/schemas/Tag';
import { getUtcNow } from '../utilities/transformers';


let processing: boolean = false;

export function initializeAutomationRunner() {
  // add default set of tags used in the automations
  db.tag.bulkPut([new Tag('img-change-detected'), new Tag('selectors-detected'), new Tag('text-change-detected')]);

  // periodic tick to recover & continue
  chrome.alarms.create('yr_queue_tick', { periodInMinutes: 1 });
  chrome.alarms.onAlarm.addListener(a => { if (a.name === 'yr_queue_tick') trigger(); });

  chrome.alarms.create('yr_scheduled_automations', { periodInMinutes: 1 });

  chrome.alarms.onAlarm.addListener(a => {
    if (a.name === 'yr_scheduled_automations'){
      debug('yr_scheduled_automations:starting')
      queueScheduledAutomations();
      debug('yr_scheduled_automations:completed')
    } });

  // resume on startup / install
  chrome.runtime.onStartup.addListener(() => { recoverExpiredLeases().then(trigger); });
  chrome.runtime.onInstalled.addListener(() => { recoverExpiredLeases().then(trigger); });

  // public API for UI / context menu to enqueue
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {

    if (msg?.cmd === 'AUTOMATIONS_ENQUEUE') {
      (async() => {
        trigger(); sendResponse({ ok: true });
      })()
      return true;
    }
  });
}

async function queueScheduledAutomations(){
  // upon trigger, we need to check for any active scheduled automations that must be run by checking their crontab evaluation and generate
  // any associated bulk automations
  db.transaction('rw', db.bulkAutomation, db.scheduledAutomation, async () => {
      processing = true;
      const scheduledAutomations: ScheduledAutomation[] = await db.scheduledAutomation.filter(scheduled => scheduled.active).toArray();
      const utcNow: Date = new Date();
      debug('Scheduling automations', {scheduledAutomations});
      utcNow.setSeconds(0, 0);
      const automations: BulkAutomationUrl[] = [];
      for (const scheduledAutomation of scheduledAutomations) {
        const interval = CronExpressionParser.parse(scheduledAutomation.crontab);
        if(interval.includesDate(utcNow)){
          // TODO: queue the job
          const automation = BulkAutomationUrl.createBulkAutomationJob(scheduledAutomation.url, {
            keepTabOpen: scheduledAutomation.keepTabOpen ?? false,
            isDeepSave: scheduledAutomation.isDeepSave ?? true,
            scheduledAutomation: scheduledAutomation ?? null,
            unitDefault: scheduledAutomation.unit ?? 'count',
            unitValue: scheduledAutomation.value ?? 100
          });
          // MUST be set to active to trigger running in the automation queue
          automation.active = true;
          automations.push(automation)
          scheduledAutomation.lastRanOn = getUtcNow();
          await db.scheduledAutomation.put(scheduledAutomation);
        }
      }
      if(automations.length > 0){
        await debug('Scheduled Automations Created', {automations});
        await db.bulkAutomation.bulkAdd(automations);
        return automations
      }
    }).then((automations) => {
      if(automations?.length ?? [].length > 0){
        debug('The following bulk automations were scheduled', {automations})
      }
    }).catch(error => {
      debug('queueScheduledAutomations::error ' + String(error));
    }).finally(() => {
      processing = false;
      trigger();
  })
}

async function trigger() {

  if (processing){
    return;
  }
  processing = true;
  processQueue().finally(() => { processing = false; });
}

async function processQueue() {
  do {
    const job = await takeNext();
    if (!job) {
      return;
    }
    ExtensionPin.setAutomationRunning(await getQueue());
    job.ranOn = new Date().getTime()
    await db.bulkAutomation.put(job);
    let tabId: number | null = null;
    try {
      const tab = await chrome.tabs.create({ url: job.url, active: false });

      if (!tab.id) {
        await debug('failed to open tab', job)
        throw new Error('failed to open tab');
      }
      tabId = tab.id;

      // Wait for load or DNS failure (ERR_NAME_NOT_RESOLVED)
      await waitForCompleteOrDnsError(tabId);
      const response = await chrome.tabs.sendMessage(tabId, { cmd: PAGE_INFO });
      const { pageInfo } = response
      await focusTab(tabId);

      // wait for the page to finish loading
      // TODO: add configurable delay
      await sleep(2000)

      // the automation requires scrolling through the page
      if (!job.isDeepSave) {
        chrome.tabs.sendMessage(tabId, { cmd: ACTIVATE_CAPTURE, automation: job })
          .then(response => {
            debug(ACTIVATE_CAPTURE + ':', response);
          })
        do {

          await sleep(1000)
          const refreshedJob = await db.bulkAutomation.get(job.uuid)

          if (!refreshedJob) {
            throw Error('Unknown job')
          }

          job.completedOn = refreshedJob.completedOn;
          job.status = refreshedJob.status

          if (job.screenShotsCollected === refreshedJob.screenShotsCollected) {
            // screen is not scrolling
            job.completedOn = new Date().getTime()
            job.status = "done";
            job.description = 'scrolling stopped';
            break;
          }
          job.screenShotsCollected = refreshedJob.screenShotsCollected
          ExtensionPin.setAutomationRunning(await getQueue());
          await sleep(1000);
        }
        while (['running', 'queued'].includes(job.status));
      }
      // deep save
      else {
        await capture(tab, pageInfo, true, job as BulkAutomationUrl);
      }
      await complete(job);
    } catch (e: any) {
      if (e instanceof NoChangeDetectedError) {
        ; // do nothing, no change was detected
        job.description = 'No Change Detected';
        await complete(job)
      } else {
        await fail(job, String(e?.message ?? e));
      }
    } finally {
      if (!job.keepTabOpen && job.status !== 'failed' && tabId) {
        try {
          await chrome.tabs.remove(tabId);
        } catch {

        }
      }
    }
  } while (true);
}

function waitForCompleteOrDnsError(tabId: number) {
  return new Promise<void>((resolve, reject) => {
    const onUpdated = (id: number, info: chrome.tabs.TabChangeInfo) => {
      if (id === tabId && info.status === 'complete') { cleanup(); resolve(); }
    };
    const onErr = (d: chrome.webNavigation.WebNavigationFramedErrorCallbackDetails) => {
      if (d.tabId === tabId && d.frameId === 0 && d.error?.includes('ERR_NAME_NOT_RESOLVED')) {
        cleanup(); reject(new Error('DNS failure: domain does not exist'));
      }
    };
    function cleanup() {
      chrome.tabs.onUpdated.removeListener(onUpdated);
      chrome.webNavigation.onErrorOccurred.removeListener(onErr);
    }
    chrome.tabs.onUpdated.addListener(onUpdated);
    chrome.webNavigation.onErrorOccurred.addListener(onErr);
  });
}

async function focusTab(tabId: number) {
  const tab = await chrome.tabs.get(tabId);
  if (tab.windowId != null) {
    await chrome.windows.update(tab.windowId, { focused: true });
  }
  await chrome.tabs.update(tabId, { active: true });
}

