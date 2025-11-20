// src/background/automation-runner.ts
import { takeNext, complete, fail, recoverExpiredLeases } from './automation-queue';
import { debug } from '../services/logger_services';
import { capture } from '../datasources/browser_capture';
import { updateRecord, getLocalItem } from '../models/db/local'
import { ACTIVATE_CAPTURE, BULK_AUTOMATION, PAGE_INFO, UUID } from '../services/constants';
import { IBulkAutomationRecord } from '../types';
import { sleep } from '../utilities/loaders';

const IDLE_MS = 6000;   // page considered stuck if no progress for this long
const OVERLAP_PX = 80;
const QUEUE_TICK_MIN = 1;

let processing = false;

export function initializeAutomationRunner() {
  // periodic tick to recover & continue
  chrome.alarms.create('yr_queue_tick', { periodInMinutes: QUEUE_TICK_MIN });
  chrome.alarms.onAlarm.addListener(a => { if (a.name === 'yr_queue_tick') trigger(); });

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

function trigger() {
  if (processing) return;
  processing = true;
  processQueue().finally(() => { processing = false; });
}

async function processQueue() {
  while (true) {
    const job = await takeNext();
    if (!job){
      return;
    }

    job.ranOn = new Date().getTime()
    await updateRecord(BULK_AUTOMATION, UUID, job);
    let tabId: number | null = null;
    try {
      const tab = await chrome.tabs.create({ url: job.url, active: false });

      if (!tab.id) throw new Error('failed to open tab');
      tabId = tab.id;

      // Wait for load or DNS failure (ERR_NAME_NOT_RESOLVED)
      await waitForCompleteOrDnsError(tabId);
      const response = await chrome.tabs.sendMessage(tabId, { cmd: PAGE_INFO });
      const { pageInfo } = response
      await focusTab(tabId);

      // wait for the page to finish loading
      // TODO: add configurable delay
      await sleep(3000)

      // the automation requires scrolling through the page
      if(!job.isDeepSave){
          chrome.tabs.sendMessage(tabId, { cmd: ACTIVATE_CAPTURE, automation: job })
            .then(response => {
              debug(ACTIVATE_CAPTURE + ':', response);
            })
        do {

          await sleep(1000)
          const refreshedJob = (await getLocalItem(BULK_AUTOMATION))
            .find((j: IBulkAutomationRecord) => j.uuid === job.uuid)

          if (!refreshedJob) {
            throw Error('Unknown job')
          }

          job.completedOn = refreshedJob.completedOn;
          job.status = refreshedJob.status

          if(job.screenShotsCollected === refreshedJob.screenShotsCollected){
            // screen is not scrolling
            job.completedOn = new Date().getTime()
            job.status = "done";
            job.description = 'scrolling stopped';
            break;
          }
          job.screenShotsCollected = refreshedJob.screenShotsCollected
          await sleep(3000);
        }
        while(['running', 'queued'].includes(job.status));
      }
      // deep save
      else {
        await capture(tab, pageInfo, true);
      }
      await complete(job);
    } catch (e: any) {
      await fail(job, String(e?.message ?? e));
    } finally {
      if(!job.keepTabOpen && job.status !== 'failed' && tabId){
        try { await chrome.tabs.remove(tabId); } catch {}
      }
    }
  }
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


export function waitForPageInfo(tabId: number) {
  return new Promise<any>((resolve, reject) => {
    const timer = setTimeout(() => {
      chrome.runtime.onMessage.removeListener(onMsg);
      reject(new Error('content handshake timeout'));
      }, 5000);
    const onMsg = (msg: any, sender: chrome.runtime.MessageSender) => {
      if (sender.tab?.id === tabId && msg?.cmd === 'YR_PAGE_INFO') {
        debug('YR_PAGE_INFO return ', msg?.pageInfo)
        const pageInfo = { ...msg.pageInfo}
        clearTimeout(timer);
        chrome.runtime.onMessage.removeListener(onMsg);
        resolve(pageInfo);
      }
    };
    // send the initialization message to the content script
    chrome.runtime.onMessage.addListener(onMsg);
    chrome.tabs.sendMessage(tabId, { cmd: 'YR_INITIALIZE' });
  });
}

async function focusTab(tabId: number) {
  const tab = await chrome.tabs.get(tabId);
  if (tab.windowId != null) await chrome.windows.update(tab.windowId, { focused: true });
  await chrome.tabs.update(tabId, { active: true });
}

