import { addRecord } from '../models/db/local';
import { Rapport } from '../models/schemas/Rapport';
import ExtensionPin from '../utilities/ExtensionPin';
import { Configuration } from '../models/schemas/Configuration';
import { RAPPORT, SELECTOR, UPDATED_ON, UUID } from '../services/constants';
import { db } from '../models/db/dexieDb';
import { debug } from '../services/logger_services';
import { Artifact } from '../models/schemas/Artifact';
import { applyBackgroundJobs } from '../services/discovery_plugin_services';

// ----- Types ---------------------------------------------------------------

export interface CaptureAutomation {
  uuid: string;
  [key: string]: unknown;
}

export interface CaptureMessage {
  sequence?: number;
  automation?: CaptureAutomation | null;
  text?: string;
  visibleText?: string;
  [key: string]: unknown;
}

/**
 * Capture the tab and persist it into local storage.
 */
export async function capture(
  tab: chrome.tabs.Tab,
  pageInfo: any = {},
  deepSave = false
): Promise<void> {
  try {
    ExtensionPin.setDefaultNotSaved(tab);

    let configuration = await Configuration.getConfiguration();
    // get/set the record count
    configuration.screenShotCount = configuration?.screenShotCount ?? 0;

    // search the saved record for keywords
    const selectors = await db.selector.toArray();

    await debug('Calling screenshot capture', { tab, pageInfo });

    // Screenshot of the visible tab; returns a data URL (string)
    const screenshot: string = await chrome.tabs.captureVisibleTab();
    const record = await Rapport.createFromTab(
      tab,
      pageInfo,
      screenshot,
      selectors,
      deepSave
    );

    // sequence id
    //record.sequenceId = 'sequence' in page ? (message.sequence ?? 0) : 0;

    // bulk automation id
    //record.bulkAutomationUuid =
    //  'automation' in message && message.automation
    //    ? message.automation.uuid
    //    : null;

    // save the mhtml artifact (deepSave)
    if (deepSave && tab.id != null) {
      // implement retry strategy to mitigate errors when saving
      let retryCounter = 0;
      let isSaved = false;

      do {
        try {
          const blob: Promise<Blob> = await chrome.pageCapture.saveAsMHTML({tabId: tab.id});

          const artifact = await Artifact.create(
            blob,
            record.uuid,
            record.url,
            'multipart/related'
          );

          // persist artifact (Dexie)
          await db.artifact.add(artifact);
          // attach reference to record
          record.artifacts.push(Artifact.getAttachment(artifact));
          isSaved = true;
        } catch (e) {
          await debug(String(e));
        } finally {
          retryCounter++;
        }
      } while (!isSaved && retryCounter < 3);
    }

    // Save the Rapport record
    await addRecord(RAPPORT, UUID, record);

    // Queue up the background jobs (fire-and-forget; log when done)
    applyBackgroundJobs(record).then(() => {
      debug('background job completed', record);
    });

    // update the configuration last saved on metadata
    configuration[UPDATED_ON] = Date.now();
    configuration.screenShotCount++;

    await Configuration.setConfiguration(configuration);
    ExtensionPin.setDefaultSaved(tab);
  } catch (error) {
    // TODO: ERROR handling for too many captures
    if (error) {
      await debug(String(error));
    }
    ExtensionPin.setBgColorAndText('red', 'ERR', tab);

    // TODO: stop scrolling when an error occurs
    //if (tab.id != null) {
    //  chrome.tabs.sendMessage(tab.id, { cmd: 'YR_STOP' } as unknown);
    //}
  } finally {
    setTimeout(() => {
      ExtensionPin.setDefault(tab);
    }, 3000);
    // TODO: additional post-processing
  }
}
