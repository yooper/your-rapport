import {
  blobToBase64Image,
  findAllMatches,
  sha256,
  sha256FromBlob,
} from '../../utilities/transformers';

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
   * TODO: fix naming convention on screenShot, make screenshot throughout the code base.
   * @param tab
   * @param text
   * @param screenShot
   * @param selectors
   * @returns {Promise<Rapport>}
   */
  static async createFromTab(tab, text, screenShot, selectors) {
    const uuid = crypto.randomUUID();
    const createdOn = Date.now();
    const hash = await sha256(screenShot);
    const domain = new URL(tab.url).hostname;
    const matchedSelectors = findAllMatches(text, selectors, 1);

    return new Rapport({
      uuid,
      title: tab.title,
      url: tab.url,
      domain,
      text,
      screenshot: screenShot,
      createdOn,
      updatedOn: createdOn,
      createdOnLocalTime: new Date().toLocaleString(),
      hash,
      createdBy: 'TODO-CREATE', // Requires auth system
      updatedBy: 'TODO-UPDATE', // Requires auth system
      length: screenShot.length,
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
    const createdOn = Date.now();
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
}
