
export function stringToBoolean(string)
{
    switch(string.toLowerCase().trim()) {
        case "true": case "yes": case "1": return true;
        case "false": case "no": case "0": case null: return false;
        default: return Boolean(string);
    }
}

export function isEmptyObj(value)
{
    return !value || Object.keys(value).length === 0
}

export function toMappedObj(records, keyFieldName = 'key', valueFieldName = 'value'){
    const mapped = records.reduce(
        (map, obj) => ((map[obj[keyFieldName]] = obj[valueFieldName]), map),
        {}
      );
    return mapped
}

// Function to generate a cache-busting URL
export function cacheBustUrl(url) {
    // Use the current timestamp as the cache-busting parameter
    const timestamp = new Date().getTime();
    // Check if the URL already has query parameters
    const separator = url.includes('?') ? '&' : '?';
    // Append the cache-busting query parameter
    return `${url}${separator}cacheBust=${timestamp}`;
}

export function parseJsonStringToArray(jsonString) {
    try {
        // Try parsing the JSON string
        const array = JSON.parse(jsonString);

        // Check if the result is indeed an array
        if (Array.isArray(array)) {
            return array;
        } else {
            throw new Error("Parsed JSON is not an array.");
        }
    } catch (error) {
        // Log the error message and return null or handle it as needed
        console.error("Error parsing JSON string:", error.message);
        return null; // or handle the error as needed
    }
}

export function base64DecodeToJson(base64String) {
  try {
    const decodedString = atob(base64String);
    const jsonObject = JSON.parse(decodedString);
    return jsonObject;
  } catch (error) {
    console.error("Error decoding or parsing JSON:", error);
    return null;
  }
}