import { Selector } from '../types';



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