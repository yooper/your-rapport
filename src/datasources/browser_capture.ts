import { Rapport } from '../models/schemas/Rapport';
import ExtensionPin from '../utilities/ExtensionPin';
import { Configuration } from '../models/schemas/Configuration';
import { db } from '../models/db/dexieDb';
import { debug } from '../services/logger_services';
import { Artifact } from '../models/schemas/Artifact';
import { getUtcNow } from '../utilities/transformers';
import BulkAutomationUrl from '../models/schemas/BulkAutomationUrl';
import { applyBackgroundJobs } from '../services/discovery_plugin_services';
import { DeepSaveError } from '../errors/DeepSaveError';
import { FastDrawError } from '../errors/FastDrawError';
import { getActiveTab, sleep } from '../utilities/loaders';
import { NoChangeDetectedError } from '../errors/NoChangeDetectedError';
import { DuplicateDetectedError } from '../errors/DuplicateDetectedError';


let _lastRapport: Rapport|null = null;


export async function capture(
  tab: chrome.tabs.Tab,
  pageInfo: any = {},
  deepSave = false,
  bulkAutomation: BulkAutomationUrl | null = null
): Promise<void> {

  let processing: boolean = true;
  let counter: number = 0;
  let retryLimit: number = 3;;

  ExtensionPin.setDefaultNotSaved(tab);
  // always force close the sidePanel upon save
  chrome.sidePanel.close({tabId: tab.id});

  do {
    _lastRapport = null
    try {
      // always reset
      await _capture(tab, pageInfo, deepSave, bulkAutomation);
      processing = false;
    }
    catch (err) {
      if (err instanceof FastDrawError) {
        // TODO: ?
        await sleep(1000);
      }
      else if (err instanceof DeepSaveError) {
        // TODO: ?
      }
      else if(err instanceof NotFoundError) {
        // TODO: ?
      }

      processing = true;
      await debug('introduce retry')
      await sleep(1000);

    } finally {
      counter++
    }
  }while(processing && counter <= retryLimit);

  // indicate to the end user the save failed
  if(processing && counter >= retryLimit){
    ExtensionPin.setBgColorAndText('red', 'ERR', tab);
  }
  else {
    ExtensionPin.setDefaultSaved(tab);
  }
}

/**
 * Capture the tab and persist it into local storage.
 */
async function _capture(
  tab1: chrome.tabs.Tab,
  pageInfo: any = {},
  deepSave = false,
  bulkAutomation: BulkAutomationUrl | null = null
): Promise<Rapport> {

  try {

    const tab = await getActiveTab();

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

    record.bulkAutomation = bulkAutomation
    await applyBackgroundJobs(record, 'preCreate')
    if(!record){
      await debug('preCreate plugin rejected saving the rapport')
      throw new NoChangeDetectedError('No Change Detected or PreCreate plugin filtered the record');
    }

    // there is an issue with duplicated records being generated, this mitigates the issue.
    if(_lastRapport && _lastRapport.hash === record.hash){
      await debug('Duplicate detected, skipping', {_lastRapport, currentRapport:record});
      throw new DuplicateDetectedError();
    }

    // save the mhtml artifact (deepSave)
    if (deepSave && tab.id != null) {
      // TODO: implement retry strategy to mitigate errors when saving
      try {
        record.artifacts = []
        await debug('saveAsMHTML:starting');
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
        await debug('saveAsMHTML:completed');

        await debug('saveHTML:starting');
        const htmlArtifact = await Artifact.create(
          new Blob([pageInfo.html], { type: 'text/html' }),
          record.uuid,
          record.url,
          'text/html'
        );
        await db.artifact.add(htmlArtifact);
        // attach reference
        record.artifacts.push(Artifact.getAttachment(htmlArtifact));
        await debug('saveHTML:starting');

      } catch (e) {
        await debug(String(e))
        throw new DeepSaveError();
      }
    }
    // persist the record
    await Rapport.add(record);
    _lastRapport = record;

    // update the configuration last saved on metadata
    configuration.updatedOn = getUtcNow();
    configuration.screenShotCount++;
    await Configuration.setConfiguration(configuration);
    return record;
  }
  catch (error) {
      await debug(String(error));
      throw new FastDrawError();
  }
  finally {
    setTimeout(() => {
      ExtensionPin.setDefault(tab);
    }, 3000);
  }
}
