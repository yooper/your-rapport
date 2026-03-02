// src/backgrounds/automation-queue.ts
import { processNotification } from '../utilities/loaders';
import { debug } from '../services/logger_services';
import { db } from '../models/db/dexieDb';
import BulkAutomationUrl from '../models/schemas/BulkAutomationUrl';


const LEASE_MS = 15 * 60_000; // 15 minutes

export async function getQueue(): Promise<BulkAutomationUrl[]> {
  return db.bulkAutomation.toArray();
}

async function setQueue(q: BulkAutomationUrl[]) {
  await db.bulkAutomation.bulkPut(q);
}

export async function takeNext(): Promise<BulkAutomationUrl | null> {
  const q = await getQueue();

  // a job is already running, skip action
  if(q.find(x => x.status === 'running')){
    await debug('takeNext: automation job is already running');
    return null;
  }

  const queuedJob = q.find(x => x.status === 'queued' && x.active && !x.ranOn);
  if (!queuedJob){
    await debug('takeNext: No items in the job queue');
    return null;
  }
  queuedJob.status = 'running';
  queuedJob.attempts += 1;
  queuedJob.leaseUntil = Date.now() + LEASE_MS;
  queuedJob.ranOn = new Date().getTime()

  await db.bulkAutomation.put(queuedJob);
  await debug('takeNext: next job queued', queuedJob);
  return queuedJob;
}

export async function complete(queuedJob: BulkAutomationUrl) {
  queuedJob.status = 'done';
  queuedJob.leaseUntil = null;
  queuedJob.completedOn = new Date().getTime();
  queuedJob.description = 'Completed Successfully';
  await db.bulkAutomation.put(queuedJob);
}

export async function fail(queuedJob: BulkAutomationUrl, reason: string) {
  if (queuedJob) {
    queuedJob.status = 'failed';
    queuedJob.failReason = reason;
    queuedJob.description = reason;
    queuedJob.leaseUntil = null;
    queuedJob.completedOn = new Date().getTime();
    await debug(`automation job failed`, queuedJob);
    await db.bulkAutomation.put(queuedJob);

    processNotification(
      {title:'Automation failed', message:`Automation failed ${queuedJob.url}\n${reason}`, type: 'danger'});
  }
}

export async function recoverExpiredLeases() {
  const q = await getQueue();
  const now = Date.now();
  let changed = false;
  for (const queuedJob of q) {
    if (queuedJob.status === 'running' && queuedJob.leaseUntil && queuedJob.leaseUntil < now) {
      queuedJob.status = 'queued';
      queuedJob.leaseUntil = null;
      changed = true;
    }
  }
  if (changed){
    await setQueue(q);
  }
}
