import {
  blobToBase64Image,
  findAllMatches,
  getUtcNow,
  sha256,
  sha256FromBlob,
} from "../../utilities/transformers";

/**
 * If you have a real Tab type from chrome, prefer that:
 *   type ChromeTab = chrome.tabs.Tab;
 * In non-extension contexts, keep it loose.
 */
export type ChromeTabLike = chrome.tabs.Tab | Record<string, unknown>;

export interface PageInfo {
  url: string;
  title?: string | null;
  text?: string | null; // full-page text (deep save)
  visibleText?: string | null; // visible text (normal save)
}

export type Relevance = "low" | "medium" | "high";

export interface RapportAttributes {
  tab?: ChromeTabLike;
  // you can extend this later with capture metadata, timing, etc.
  [k: string]: unknown;
}

export interface RapportInit {
  uuid: string;
  title: string | null;
  url: string;
  domain: string;
  text: string;
  screenshot: string; // base64 (data url or raw)
  createdOn: string | number | Date;
  updatedOn: string | number | Date;
  createdOnLocalTime: string;
  hash: string;
  createdBy: string;
  updatedBy: string;
  length: number;
  attributes: RapportAttributes;
  selectors: unknown[]; // tighten if you have a Selector type
  tags: string[];
  caseManagementUuid: string | null;
  note: string | null;
  isImportant: boolean;
  relevance: Relevance;
  bulkAutomationUuid?: string | null;
}

export class Rapport {
  uuid: string;
  title: string | null;
  url: string;
  domain: string;
  text: string;
  screenshot: string;
  createdOn: string | number | Date;
  updatedOn: string | number | Date;
  createdOnLocalTime: string;
  hash: string;
  createdBy: string;
  updatedBy: string;
  length: number;
  attributes: RapportAttributes;
  selectors: unknown[];
  tags: string[];
  caseManagementUuid: string | null;
  note: string | null;
  isImportant: boolean;
  relevance: Relevance;
  bulkAutomationUuid: string | null;
  artifacts: unknown[];

  constructor(init: RapportInit) {
    this.uuid = init.uuid;
    this.title = init.title;
    this.url = init.url;
    this.domain = init.domain;
    this.text = init.text;
    this.screenshot = init.screenshot;
    this.createdOn = init.createdOn;
    this.updatedOn = init.updatedOn;
    this.createdOnLocalTime = init.createdOnLocalTime;
    this.hash = init.hash;
    this.createdBy = init.createdBy;
    this.updatedBy = init.updatedBy;
    this.length = init.length;
    this.attributes = init.attributes;
    this.selectors = init.selectors;
    this.tags = init.tags;
    this.caseManagementUuid = init.caseManagementUuid;
    this.note = init.note;
    this.isImportant = init.isImportant;
    this.relevance = init.relevance;
    this.bulkAutomationUuid = init.bulkAutomationUuid ?? null;
    this.artifacts = [];
  }

  /**
   * Create a Rapport from a browser tab + pageInfo.
   * Improvements:
   * - Strong typing
   * - URL parsing guard
   * - Always lowercases consistently
   * - deepSave is actually used (your original call passed false)
   */
  static async createFromTab(
    tab: ChromeTabLike,
    pageInfo: PageInfo,
    screenshotBase64: string,
    selectors: unknown[],
    deepSave: boolean
  ): Promise<Rapport> {
    const uuid = crypto.randomUUID();
    const createdOn = getUtcNow();
    const hash = await sha256(screenshotBase64);

    const domain = Rapport.safeHostname(pageInfo.url);

    const combinedText =
      `${(pageInfo.title ?? "").toLowerCase()} ` +
      Rapport.getText(pageInfo, deepSave);

    const matchedSelectors = findAllMatches(combinedText, selectors, 1);

    return new Rapport({
      uuid,
      title: pageInfo.title ?? null,
      url: pageInfo.url,
      domain,
      text: combinedText,
      screenshot: screenshotBase64,
      createdOn,
      updatedOn: createdOn,
      createdOnLocalTime: new Date().toLocaleString(),
      hash,
      createdBy: "TODO-CREATE", // Requires auth system
      updatedBy: "TODO-UPDATE", // Requires auth system
      length: screenshotBase64?.length ?? 0,
      attributes: { tab },
      selectors: matchedSelectors,
      tags: [],
      caseManagementUuid: "30583002-f730-4383-bf28-fdd8aadcf387",
      note: null,
      isImportant: false,
      relevance: "low",
      bulkAutomationUuid: null,
    });
  }

  /**
   * Create a Rapport from a Blob (image/file).
   * Improvements:
   * - Strong typing
   * - URL parsing guard
   * - Keeps signature open for future text extraction
   */
  static async createFromBlob(
    blob: Blob,
    url: string,
    title: string | null,
    selectors: unknown[] // kept for parity; currently unused here
  ): Promise<Rapport> {
    void selectors; // reserved for future logic (text extraction, matching)

    const uuid = crypto.randomUUID();
    const createdOn = getUtcNow();
    const hash = await sha256FromBlob(blob);
    const domain = Rapport.safeHostname(url);
    const base64 = await blobToBase64Image(blob);

    return new Rapport({
      uuid,
      title,
      url,
      domain,
      text: "",
      screenshot: base64,
      createdOn,
      updatedOn: createdOn,
      createdOnLocalTime: new Date().toLocaleString(),
      hash,
      createdBy: "TODO-CREATE",
      updatedBy: "TODO-UPDATE",
      length: base64?.length ?? 0,
      attributes: {},
      selectors: [],
      tags: [],
      caseManagementUuid: "30583002-f730-4383-bf28-fdd8aadcf387",
      note: null,
      isImportant: false,
      relevance: "low",
      bulkAutomationUuid: null,
    });
  }

  /**
   * Return the text to be used in search.
   * - deepSave: prefer full page text
   * - otherwise: prefer visible text and split camel case
   */
  static getText(pageInfo: PageInfo, deepSave: boolean): string {
    if (deepSave) {
      return (pageInfo.text ?? "").toLowerCase();
    }
    return Rapport.splitCamelCase(pageInfo.visibleText ?? "").toLowerCase();
  }

  static splitCamelCase(input: string): string {
    return input
      .replace(/([a-z])([A-Z])/g, "$1 $2") // lower → upper: add space
      .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2") // "HTMLParser" → "HTML Parser"
      .trim();
  }

  private static safeHostname(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      // Avoid throwing in capture flows; keep something stable.
      return "";
    }
  }
}
