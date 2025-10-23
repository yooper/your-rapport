import { getSelectorTypeMap } from '../utilities/loaders';
import { Configuration } from '../models/schemas/Configuration';
import ExtensionPin from '../utilities/ExtensionPin';
import {
  ACTIVATE_CAPTURE,
  BULK_AUTOMATION,
  RAPPORT,
  UPDATED_ON,
  UUID,
} from './constants';
import { captureSingleScreenShot } from './collection_services';
import { BulkAutomationUrl } from '../models/schemas/BulkAutomationUrl';
import { Selector } from '../models/schemas/Selector';
import { addRecord } from '../models/db/local';
import { selectCorrectLink } from '../utilities/transformers';
import { Rapport } from '../models/schemas/Rapport';
import { fetchBlob } from './image_loading_services';

/**
 * Add the selectors as menu items
 * @returns {Promise<void>}
 */
export async function initializeContextMenus() {
  await chrome.contextMenus.removeAll();

  // add download image, video, audio support
  chrome.contextMenus.create({
    id: 'collectImage',
    title: 'Collect Image',
    contexts: ['image'],
  });

  // TODO: support audio and video collection

  // add capture context menu to the UI
  chrome.contextMenus.create({
    id: 'autocollectPage',
    title: 'Autoscroll Collect',
    contexts: ['page', 'image', 'video', 'audio'],
  });

  // add link to bulk capture for future research
  chrome.contextMenus.create({
    id: 'addBulkAutomationUrl',
    title: 'Add url to Automation Queue',
    contexts: ['link'],
  });

  // Add right click for capturing these other types of contexts
  chrome.contextMenus.create({
    id: 'deepSave',
    title: 'Deep Save',
    contexts: ['page', 'image', 'video', 'audio'],
  });

  // add a seperator
  chrome.contextMenus.create({
    type: 'separator',
    id: 'separator_1',
    contexts: ['selection'],
  });

  for (const [key, label] of Object.entries(getSelectorTypeMap())) {
    chrome.contextMenus.create({
      title: `Capture text as a ${label}`,
      id: key,
      contexts: ['selection'],
      type: 'normal',
    });
  }
  // add event listeners
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
      case 'collectImage':
        (async () => {
          ExtensionPin.setTemporaryPin('SAVG');
          const downloadedBlob = await fetchBlob(info.srcUrl);
          const rapport = await Rapport.createFromBlob(
            downloadedBlob,
            info.srcUrl,
            tab.title,
            []
          );
          rapport.sequenceId = 0;
          rapport.bulkAutomationUuid = null;
          await addRecord(RAPPORT, UUID, rapport);
          // update the configuration last saved on metadata
          let configuration = await Configuration.getConfiguration();
          // get/set the record count
          configuration.screenShotCount = configuration?.screenShotCount ?? 0;
          configuration[UPDATED_ON] = Date.now();
          configuration.screenShotCount++;
          await Configuration.setConfiguration(configuration);
          ExtensionPin.setDefaultSaved(tab);
        })();
        break;
      case 'deepSave':
        ExtensionPin.setTemporaryPin('SAVG');
        captureSingleScreenShot(true).then();
        break;
      case 'autocollectPage':
        captureSingleScreenShot().then(() => {
          ExtensionPin.setTemporaryPin('SAVG');
          chrome.tabs.sendMessage(tab.id, { cmd: ACTIVATE_CAPTURE });
        });
        break;
      case 'addBulkAutomationUrl':
        (async () => {
          const unitDefault = await Configuration.getConfigurationValue(
            'automationUnitDefault',
            'count'
          );
          const valueDefault = await Configuration.getConfigurationValue(
            'automationValueDefault',
            100
          );
          const keepTabOpenDefault = await Configuration.getConfigurationValue(
            'automationKeepTabOpenDefault',
            true
          );
          const urlLink = selectCorrectLink({
            linkUrl: info.linkUrl,
            frameUrl: info.frameUrl,
            pageUrl: info.pageUrl,
          });
          await addRecord(BULK_AUTOMATION, UUID, {
            uuid: crypto.randomUUID(),
            url: urlLink,
            createdOn: Date.now(),
            completedOn: null,
            ranOn: null,
            unit: unitDefault,
            value: valueDefault,
            keepTabOpen: keepTabOpenDefault,
            screenShotsCollected: 0,
            isDeepSave: false
          });
          ExtensionPin.setTemporaryPin('SAVD');
        })();
        break;
      default:
        const selectorTypeName = info.menuItemId;
        const value = info.selectionText;
        Selector.add(new Selector(value, new String(selectorTypeName)));
        ExtensionPin.setTemporaryPin('SAVD');
        break;
    }
  });
}
