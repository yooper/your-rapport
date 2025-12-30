import { Rapport } from '../models/schemas/Rapport';
import ExtensionPin from '../utilities/ExtensionPin';
import { Configuration } from '../models/schemas/Configuration';
import { db } from '../models/db/dexieDb';
import { debug } from '../services/logger_services';
import { Artifact } from '../models/schemas/Artifact';
import { applyBackgroundJobs } from '../services/discovery_plugin_services';
import { getUtcNow } from '../utilities/transformers';

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

    // save the mhtml artifact (deepSave)
    if (deepSave && tab.id != null) {
      // implement retry strategy to mitigate errors when saving
      let retryCounter = 0;
      let isSaved = false;

      do {
        try {
          const blob: Promise<Blob> = await chrome.pageCapture.saveAsMHTML({tabId: tab.id});
          const mhtmlArtifact = await Artifact.create(
            blob,
            record.uuid,
            record.url,
            'multipart/related'
          );

          // persist artifact (Dexie)
          await db.artifact.add(mhtmlArtifact);
          // attach reference to record
          record.artifacts.push(Artifact.getAttachment(mhtmlArtifact));

          const htmlArtifact = await Artifact.create(
            new Blob([pageInfo.html], { type: 'text/html' }),
            record.uuid,
            record.url,
            'text/html'
          );
          await db.artifact.add(htmlArtifact);
          record.artifacts.push(Artifact.getAttachment(htmlArtifact));
          isSaved = true;

        } catch (e) {
          await debug(String(e));
        } finally {
          retryCounter++;
        }
      } while (!isSaved && retryCounter < 3);

      if(isSaved){
        await Rapport.add(record);
      }
    }
    else{
      await Rapport.add(record);
    }

    // update the configuration last saved on metadata
    configuration.updatedOn = getUtcNow();
    configuration.screenShotCount++;

    await Configuration.setConfiguration(configuration);
    ExtensionPin.setDefaultSaved(tab);
  } catch (error) {
    // TODO: ERROR handling for too many captures
    if (error) {
      await debug(String(error));
    }
    ExtensionPin.setBgColorAndText('red', 'ERR', tab);

  } finally {
    setTimeout(() => {
      ExtensionPin.setDefault(tab);
    }, 3000);
    // TODO: additional post-processing
  }
}
