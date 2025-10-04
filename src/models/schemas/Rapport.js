import { findAllMatches, sha256 } from '../../utilities/transformers';

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
    bulkAutomationUuid
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
    this.bulkAutomationUuid = bulkAutomationUuid;
    this.artifacts = [];
  }

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
    });
  }
}
