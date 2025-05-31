import { getLocalItem } from '../models/db/local';
import ExtensionPin from './ExtensionPin';
import { SELECTOR } from '../services/constants';

export function stringToBoolean(string) {
  switch (string.toLowerCase().trim()) {
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
      return Boolean(string);
  }
}





/**
 * Converts a JavaScript object to a JSON file
 *
 * @param {Object} obj - The object to convert
 * @param {string} fileName - The name of the file (e.g., "record.json")
 * @returns {File} - A downloadable File object
 */
function _objectToJsonFile(obj, fileName) {
  const jsonString = JSON.stringify(obj, null, 2); // pretty-printed
  const blob = new Blob([jsonString], { type: 'application/json' });
  return new File([blob], fileName, { type: 'application/json' });
}




/**
 * Get a hash string of the message
 * @param message
 * @returns {Promise<string>}
 */
export async function sha256(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return hashHex;
}

/**
 * Invokes downloading of json file
 * @param data
 * @param fileName
 */
export function downloadJsonData(data, fileName = 'data.json', type = '') {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link); // Required for Firefox
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url); // Clean up
}

/**
 * Expects a data specified base64 string
 * @param base64Data
 * @param fileName
 */
export function downloadBase64Image(base64Data, fileName) {
  // Create a new anchor element
  const link = document.createElement('a');
  // Set the download attribute with the desired file name
  link.download = fileName;
  // Set href to the base64 data
  link.href = base64Data;

  // Append the link to the body (necessary for Firefox)
  document.body.appendChild(link);
  // Programmatically click the link to trigger the download
  link.click();
  // Remove the link from the document
  document.body.removeChild(link);
}

/**
 * @param str
 * @returns {string}
 */
const toCamelCase = (str) => {
  return str.charAt(0).toLowerCase() + str.slice(1);
};

/**
 * Change the name of the fields from PascalCase to camelCase.
 * @param obj
 * @returns {{}|*}
 */
export function convertKeysToCamelCase(obj) {
  if (Array.isArray(obj)) {
    return obj.map(convertKeysToCamelCase);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      acc[toCamelCase(key)] = convertKeysToCamelCase(value);
      return acc;
    }, {});
  }
  return obj;
}

export function sortByField(array, key) {
  if (!array || array.length === 0) {
    return [];
  } else if (array.length === 1) {
    return array;
  }
  return array.sort((a, b) => {
    const x = a[key];
    const y = b[key];
    return x < y ? -1 : x > y ? 1 : 0;
  });
}

/**
 *
 * @param base64Data
 * @param fileName
 * @returns {module:buffer.File}
 */
export function base64ToFile(base64Data, fileName) {
  const [prefix, base64] = base64Data.includes(',')
    ? base64Data.split(',')
    : [null, base64Data];
  const mimeMatch = prefix?.match(/data:(.*);base64/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
  const binary = atob(base64);
  const len = binary.length;
  const buffer = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return new File([buffer], fileName, { type: mimeType });
}

/**
 * Finds the first match of the selector within text.
 * TODO: Tokenize & normalize text and selector key to improve matching algorithm and support fuzzy matching
 * @param {string} text - The text + title to search in.
 * @param {Array<{ key: string }>} items - The array of objects with `value` fields.
 * @returns {Array<{ match: string, index: number, ref: object }>} List of matches with references
 */
export function findMatchingValues(text, selectors) {
  const matches = [];
  for (let i = 0; i < selectors.length; i++) {
    const selector = selectors[i];
    if (text.includes(selector.key)) {
      matches.push(selector);
    }
  }
  return matches;
}

/**
 * Does a full scan of all the text trying to find any selectors contained with,
 * primarily used by the scan feature
 * @param text
 * @param selectors
 * @param limit
 * @returns {*[]}
 */
export function findAllMatches(text, selectors, limit = 100) {
  const matches = [];
  for (const selector of selectors) {
    const key = selector.key;
    selector.count = 0;
    const occurrences = [];

    let index = 0;

    while (index <= text.length - key.length) {
      let match = true;

      for (let k = 0; k < key.length; k++) {
        if (text[index + k] !== key[k]) {
          match = false;
          break;
        }
      }

      if (match) {
        occurrences.push({ index, match: key });
        index += key.length; // Move past this match to avoid overlapping
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

/**
 * @param activeTab
 * @returns {Promise<void>}
 */
export async function scanPage(activeTab) {
  const response = await chrome.tabs.sendMessage(activeTab.id, {
    cmd: 'getFullText',
  });
  const selectors = findAllMatches(
    response.text,
    await getLocalItem(SELECTOR)
  );
  // after the scan is done, limit the max numbers for the UI
  const totalCount = Math.min(
    selectors.reduce((sum, item) => sum + item.count, 0),
    99
  );
  ExtensionPin.showNumber(
    Math.min(selectors.length, 9) + '|' + totalCount,
    activeTab.id
  );
  chrome.tabs
    .sendMessage(activeTab.id, { cmd: 'markText', selectors: selectors })
    .then(() => {});
}
