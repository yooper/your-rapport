import { Rapport } from '../models/schemas/Rapport';
import ExtensionPin from '../utilities/ExtensionPin';
import { Configuration } from '../models/schemas/Configuration';
import { db } from '../models/db/dexieDb';
import { debug } from '../services/logger_services';
import { Artifact } from '../models/schemas/Artifact';
import { getUtcNow } from '../utilities/transformers';
import BulkAutomationUrl from '../models/schemas/BulkAutomationUrl';
import { areEqual } from '../services/change_detection_services';
import { applyBackgroundJobs } from '../services/discovery_plugin_services';
import { Tag } from '../models/schemas/Tag';
import { NoChangeDetectedError } from '../errors/NoChangeDetectedError';

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


    if(bulkAutomation)
    {
      // assign the bulk automation if one has been
      record.bulkAutomation = bulkAutomation;
      const scheduledAutomation = record.bulkAutomation?.scheduledAutomation ?? null;

      if(scheduledAutomation && scheduledAutomation.onlySaveOnChange)
      {
        const previousRapports: Rapport[]|undefined = await db.rapport
            .where("domain")
            .equals(record.domain)
            .filter(r => r.bulkAutomation?.scheduledAutomation?.uuid === scheduledAutomation.uuid)
            .sortBy('createdOn')

        const previousRapport: Rapport|null = previousRapports.at(-1) ?? null;

        if(previousRapports.length > 0 && areEqual(record, previousRapport, ['hash'])){
          // should be using the latest save
          debug('only save on change -> change not detected, ignore', {scheduledAutomation, rapport:record, previousRapport})
          ExtensionPin.setDefault();
          throw new NoChangeDetectedError();
          return;
        }

        record.tags = [new Tag('change-detected')];
      }
    }

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
