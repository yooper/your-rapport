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
import { NoChangeDetectedError } from '../errors/NoChangeDetectedError';
import { DuplicateDetectedError } from '../errors/DuplicateDetectedError';
import { initExtensionPage } from '../services/init_services';
import { Tag } from '../models/schemas/Tag';
import { sleep } from '../utilities/loaders';


let _lastRapport: Rapport|null = null;
let _captureProcessing: boolean = false;
let _queue: any = []

export async function capture(
  tab: chrome.tabs.Tab,
  pageInfo: any = {},
  deepSave = false,
  bulkAutomation: BulkAutomationUrl | null = null
): Promise<void> {

  _queue.push({tab, pageInfo, deepSave, bulkAutomation});

  if(_captureProcessing){
    return;
  }
  await initExtensionPage();
  _captureProcessing = true;
  let current:any = null
  do{
    const current = _queue.shift()
    ExtensionPin.setDefaultSaved(current.tab);

    try {
      // call the get active tab in _capture
      await _capture(current.tab, current.pageInfo, current.deepSave, current.bulkAutomation);
      ExtensionPin.setDefaultSaved(current.tab);
    }
    catch (err) {
      await debug('capture:error', {pageInfo: current.pageInfo, deepSave: current.deepSave, bulkAutomation: current.bulkAutomation})

    }
    finally {
      if(_queue.length === 0){
        _captureProcessing = false;
      }
    }
  } while(_captureProcessing);
}

/**
 * Capture the tab and persist it into local storage.
 * TODO: the wrong screen is captured if the end user toggles too quick between the tabs
 * TODO: wrap in transaction
 */
async function _capture(
  tab: chrome.tabs.Tab,
  pageInfo: any = {},
  deepSave = false,
  bulkAutomation: BulkAutomationUrl | null = null
): Promise<Rapport> {

  try {

    let configuration = await Configuration.getConfiguration();
    // search the saved record for keywords
    const selectors = await db.selector.toArray();
    await debug('Calling screenshot capture', { tab, pageInfo });
    await chrome.windows.update(tab.windowId, { focused: true });
    const screenshot: string = await chrome.tabs.captureVisibleTab(tab.windowId, {format:'png'});
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
    // TODO: abstract this out
    if (deepSave && tab.id != null) {
      // TODO: implement retry strategy to mitigate errors when saving
      try {
        record.artifacts = []
        await debug('saveAsMHTML:starting');
        let mhtmlArtifact: Promise<Artifact> | null = null;
        let retry = 0
        do{
          try {
            const blob: Blob = await chrome.pageCapture.saveAsMHTML({ tabId: tab.id });
            mhtmlArtifact = await Artifact.create(
              blob,
              record.uuid,
              record.url,
              'multipart/related'
            );
          }
          catch(error){
            retry++;
            await sleep(600 * retry)
            await debug('saveAsMHTML:error retry:'+retry, error);
          }
        } while(retry < 5 && !mhtmlArtifact)

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
        // save the original html from the web page
        await db.artifact.add(htmlArtifact);
        // attach reference
        record.artifacts.push(Artifact.getAttachment(htmlArtifact));
        await debug('saveHTML:completed');

        record.tags = [new Tag('deep-save')];
      } catch (e: any) {
        await debug(e.message, {e})
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
  catch (error: any) {
    await debug('capture:error_caught');
  }
  finally {
    setTimeout(() => {
      ExtensionPin.setDefault(tab);
    }, 3000);
  }
}