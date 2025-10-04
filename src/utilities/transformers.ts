import { getLocalItem } from '../models/db/local';
import ExtensionPin from './ExtensionPin';
import { SELECTOR } from '../services/constants';
import { ActiveTab } from '../types';
import { Selector } from '../models/schemas/Selector';

// Utility: Convert string to boolean
export function stringToBoolean(str: string | null): boolean {
  if (str === null) return false;

  switch (str.toLowerCase().trim()) {
    case 'true':
    case 'yes':
    case '1':
      return true;
    case 'false':
    case 'no':
    case '0':
    case null:
      return false;
    default:
      return Boolean(str);
  }
}

// Utility: Convert object to JSON file
export function objectToJsonFile(obj: object, fileName: string): File {
  const jsonString = JSON.stringify(obj, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  return new File([blob], fileName, { type: 'application/json' });
}

// Utility: SHA-256 hashing
export async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Utility: Download JSON data as file
export function downloadJsonData(data: unknown, fileName: string = 'data.json'): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Utility: Download base64-encoded image
export function downloadBase64Image(base64Data: string, fileName: string): void {
  const link = document.createElement('a');
  link.download = fileName;
  link.href = base64Data;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Helper: Convert PascalCase to camelCase
const toCamelCase = (str: string): string =>
  str.charAt(0).toLowerCase() + str.slice(1);

// Utility: Convert all object keys to camelCase
export function convertKeysToCamelCase(obj: unknown): any {
  if (Array.isArray(obj)) {
    return obj.map(convertKeysToCamelCase);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.entries(obj).reduce((acc: any, [key, value]) => {
      acc[toCamelCase(key)] = convertKeysToCamelCase(value);
      return acc;
    }, {});
  }
  return obj;
}

// Utility: Sort array of objects by key
export function sortByField<T>(array: T[], key: keyof T): T[] {
  if (!array || array.length <= 1) return array;

  return array.sort((a, b) => {
    const x = a[key];
    const y = b[key];
    return x < y ? -1 : x > y ? 1 : 0;
  });
}

// Utility: Convert base64 image string to File
export function base64ToFile(base64Data: string, fileName: string): File {
  const [prefix, base64] = base64Data.includes(',')
    ? base64Data.split(',')
    : [null, base64Data];
  const mimeMatch = prefix?.match(/data:(.*);base64/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
  const binary = atob(base64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return new File([buffer], fileName, { type: mimeType });
}



// Scans the page content of the tab and highlights matching selectors
export async function scanPage(activeTab: ActiveTab): Promise<void> {
  if (!activeTab.id) return;

  const response: { text: string } = await chrome.tabs.sendMessage(activeTab.id, {
    cmd: 'getFullText',
  });

  const selectors = findAllMatches(response.text, await getLocalItem(SELECTOR));
  const totalCount = Math.min(
    selectors.reduce((sum: number, item: any) => sum + item.count, 0),
    99
  );

  ExtensionPin.showNumber(`${Math.min(selectors.length, 9)}|${totalCount}`, activeTab.id);

  await chrome.tabs.sendMessage(activeTab.id, {
    cmd: 'markText',
    selectors: selectors,
  });
}

/**
 * Does a full scan of all the text trying to find any selectors contained with,
 * primarily used by the scan feature
 * @param text
 * @param selectors
 * @param limit
 */

export function findAllMatches(text: string, selectors: Array<Selector>, limit: number = 100) {
  const matches = [];
  for (const selector of selectors) {
    const value = selector.name;
    selector.count = 0;
    const occurrences = [];

    let index = 0;

    while (index <= text.length - value.length) {
      let match = true;

      for (let k = 0; k < value.length; k++) {
        if (text[index + k] !== value[k]) {
          match = false;
          break;
        }
      }

      if (match) {
        occurrences.push({ index, match: value });
        index += value.length; // Move past this match to avoid overlapping
        selector.count++;
      } else {
        index++;
      }

      if (selector.count >= limit) {
        break; // stop counting if the limit has been hit
      }
    }
    if (occurrences.length > 0) {
      matches.push(selector);
    }
  }
  return matches;
}

export function anyProperty<T extends Record<string, any>>(obj: T, keys: string[]): boolean {
  return keys.some(key => Object.prototype.hasOwnProperty.call(obj, key) && obj[key] != null && obj[key] !== "");
}


interface LinkContext {
  linkUrl?: string;
  frameUrl?: string;
  pageUrl?: string;
}

/**
 * Returns the most correct, usable link for a given click context.
 * Handles subdomains, redirects, and marketing/tracking URLs.
 */
export function selectCorrectLink({
  linkUrl,
  frameUrl,
  pageUrl,
}: LinkContext): string | null {
  const link = linkUrl?.trim() || "";
  const frame = frameUrl?.trim() || "";
  const page = pageUrl?.trim() || "";

  if (!link && !frame) return null;

  const BLOCKLIST = [
    "taboola.com",
    "doubleclick.net",
    "facebook.com",
    "t.co",
    "outbrain.com",
    "googlesyndication.com",
    "googleadservices.com",
    "clickserve",
    "bit.ly",
    "lnkd.in",
  ];

  /** Extracts a normalized root domain (handles subdomains) */
  const getDomain = (url: string): string | null => {
    try {
      const { hostname } = new URL(url);
      const parts = hostname.split(".");
      return parts.slice(-2).join("."); // simple heuristic: example.com, not subdomain.example.com
    } catch {
      return null;
    }
  };

  /** Checks if two URLs belong to the same root domain */
  const isSameSite = (a: string, b: string): boolean => {
    const da = getDomain(a);
    const db = getDomain(b);
    return da && db && da === db;
  };

  /** True if a URL points to a homepage/root */
  const isRoot = (url: string): boolean => {
    try {
      const u = new URL(url);
      return u.pathname === "/" && !u.search && !u.hash;
    } catch {
      return false;
    }
  };

  const pathDepth = (url: string): number => {
    try {
      return new URL(url).pathname.split("/").filter(Boolean).length;
    } catch {
      return 0;
    }
  };

  const isBlocked = (url: string): boolean => {
    return BLOCKLIST.some((b) => url.includes(b));
  };

  if (link && !isRoot(link) && !isBlocked(link)) {
    if (frame && isSameSite(link, frame)) {
      // If both are on the same site, prefer the deeper one
      return pathDepth(link) >= pathDepth(frame) ? link : frame;
    }
    return link;
  }

  if (isBlocked(link) && frame && !isRoot(frame)) {
    return frame;
  }

  if (frame && !isRoot(frame)) return frame;

  return link || frame;
}
