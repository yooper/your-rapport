
export function stringToBoolean(string)
{
    switch(string.toLowerCase().trim()) {
        case "true": case "yes": case "1": return true;
        case "false": case "no": case "0": case null: return false;
        default: return Boolean(string);
    }
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


export async function getActiveTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

/**
 * Invokes downloading of json file
 * @param data
 * @param fileName
 */
export function downloadJsonData(data, fileName = 'data.json', type = '') {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
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
  const link = document.createElement("a");
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
}


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
    if(!array || array.length === 0){
        return []
    }
    else if(array.length === 1){
        return array
    }
    return array.sort( (a, b) => {
        const x = a[key]
        const y = b[key]
        return ((x < y) ? -1 : ((x > y) ? 1 : 0))
    })
}