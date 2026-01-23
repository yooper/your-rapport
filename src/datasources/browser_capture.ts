import { Rapport } from '../models/schemas/Rapport';
import ExtensionPin from '../utilities/ExtensionPin';
import { Configuration } from '../models/schemas/Configuration';
import { db } from '../models/db/dexieDb';
import { debug } from '../services/logger_services';
import { Artifact } from '../models/schemas/Artifact';
import { getUtcNow } from '../utilities/transformers';
import BulkAutomationUrl from '../models/schemas/BulkAutomationUrl';
import { applyBackgroundJobs } from '../services/discovery_plugin_services';


let _lastRapport: Rapport|null = null;

/**
 * Capture the tab and persist it into local storage.
 */
export async function capture(
  tab: chrome.tabs.Tab,
  pageInfo: any = {},
  deepSave = false,
  bulkAutomation: BulkAutomationUrl | null = null
): Promise<void> {
  try {
    ExtensionPin.setDefaultNotSaved(tab);
    let configuration = await Configuration.getConfiguration();
    // always force close the sidePanel upon save
    chrome.sidePanel.close({tabId: tab.id});
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

    record.bulkAutomation = bulkAutomation
    await applyBackgroundJobs(record, 'preCreate')
    if(!record){
      debug('preCreate plugin rejected saving the rapport')
      return;
    }

    // there is an issue with duplicated records being generated, this mitigates the issue.
    if(_lastRapport && _lastRapport.hash === record.hash){
      debug('Duplicate detected, skipping', {_lastRapport, currentRapport:record});
      return;
    }

    // save the mhtml artifact (deepSave)
    if (deepSave && tab.id != null) {
      // implement retry strategy to mitigate errors when saving
      try {
        const blob: Promise<Blob> = await chrome.pageCapture.saveAsMHTML({ tabId: tab.id });
        const mhtmlArtifact = await Artifact.create(
          blob,
          record.uuid,
          record.url,
          'multipart/related'
        );

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
        // attach reference
        record.artifacts.push(Artifact.getAttachment(htmlArtifact));

      } catch (e) {
        await debug(String(e))
        return;
      }
    }
    // persist the record
    await Rapport.add(record);
    _lastRapport = record;

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
  }
}
