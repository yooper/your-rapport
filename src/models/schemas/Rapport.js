import {
  blobToBase64Image,
  findAllMatches, getUtcNow,
  sha256,
  sha256FromBlob,
} from '../../utilities/transformers';
import { CaptureMessage } from '../../datasources/browser_capture';

export class Rapport {
  constructor({
    uuid,
    title,
    url,
    domain,
    text,
    screenshot,
    createdOn,
    updatedOn,
    createdOnLocalTime,
    hash,
    createdBy,
    updatedBy,
    length,
    attributes,
    selectors,
    tags,
    caseManagementUuid,
    note,
    isImportant,
    relevance,
    bulkAutomationUuid,
  }) {
    this.uuid = uuid;
    this.title = title;
    this.url = url;
    this.domain = domain;
    this.text = text;
    this.screenshot = screenshot;
    this.createdOn = createdOn;
    this.updatedOn = updatedOn;
    this.createdOnLocalTime = createdOnLocalTime;
    this.hash = hash;
    this.createdBy = createdBy;
    this.updatedBy = updatedBy;
    this.length = length;
    this.attributes = attributes;
    this.selectors = selectors;
    this.tags = tags;
    this.caseManagementUuid = caseManagementUuid;
    this.note = note;
    this.isImportant = isImportant;
    this.relevance = relevance;
    this.bulkAutomationUuid = bulkAutomationUuid;
    this.artifacts = [];

  }

  /**
   * @param tab
   * @param pageInfo
   * @param screenshot
   * @param selectors
   * @returns {Promise<Rapport>}
   */
  static async createFromTab(tab, pageInfo, screenshot, selectors, deepSave) {
    const uuid = crypto.randomUUID();
    const createdOn = getUtcNow();
    const hash = await sha256(screenshot);
    const domain = new URL(pageInfo.url).hostname;
    const text =
      (pageInfo.title?.toLowerCase() ?? '') + ' ' + Rapport.getText(pageInfo, false);
    const matchedSelectors = findAllMatches(text, selectors, 1);

    return new Rapport({
      uuid,
      title: pageInfo.title,
      url: pageInfo.url,
      domain,
      text,
      screenshot: screenshot,
      createdOn,
      updatedOn: createdOn,
      createdOnLocalTime: new Date().toLocaleString(),
      hash,
      createdBy: 'TODO-CREATE', // Requires auth system
      updatedBy: 'TODO-UPDATE', // Requires auth system
      length: screenshot.length,
      attributes: { tab },
      selectors: matchedSelectors,
      tags: [], // Placeholder for future tagging
      caseManagementUuid: '30583002-f730-4383-bf28-fdd8aadcf387',
      note: null,
      isImportant: false,
      relevance: 'low'
    });
  }

  /**
   * A factory method for adding content
   * TODO: support more than images
   * TODO: support text extraction
   * @param blob
   * @param url
   * @param title
   * @param selectors
   * @returns {Promise<Rapport>}
   */
  static async createFromBlob(blob, url, title, selectors) {
    const uuid = crypto.randomUUID();
    const createdOn = getUtcNow();
    const hash = await sha256FromBlob(blob);
    const domain = new URL(url).hostname;
    const text = '';
    const base64 = await blobToBase64Image(blob);
    return new Rapport({
      uuid,
      title: title,
      url: url,
      domain,
      text,
      screenshot: base64,
      createdOn,
      updatedOn: createdOn,
      createdOnLocalTime: new Date().toLocaleString(),
      hash,
      createdBy: 'TODO-CREATE', // Requires auth system
      updatedBy: 'TODO-UPDATE', // Requires auth system
      length: base64.length,
      attributes: {},
      selectors: [],
      tags: [], // Placeholder for future tagging
      caseManagementUuid: '30583002-f730-4383-bf28-fdd8aadcf387',
      note: null,
      isImportant: false
    });
  }

  /**
   * Return the text to be used in the search
   */
  static getText(pageInfo, deepSave){
    if (deepSave) {
      // If deepSave is true, prefer full page text supplied by caller
      return (pageInfo.text ?? '').toLowerCase();
    }
    // Otherwise prefer the visible text (normalized/split)
    return Rapport.splitCamelCase(pageInfo.visibleText ?? '').toLowerCase();
  }

  static splitCamelCase(input){
    return input
      .replace(/([a-z])([A-Z])/g, '$1 $2') // lower → upper: add space
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2') // "HTMLParser" → "HTML Parser"
      .trim();
  }

}
