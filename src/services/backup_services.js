/**
 * Extract JSON files from a ZIP blob created by fflate
 * @param {Blob} zipBlob
 * @returns {Promise<Array<{ filename: string, data: Object }>>}
 */
import * as fflate from 'fflate';

const YR_META_FILE_NAME = 'yr_metadata.json';

export async function zipImport(zipBlob) {
  const buffer = new Uint8Array(await zipBlob.arrayBuffer());
  const unzipped = fflate.unzipSync(buffer);

  const results = [];

  if(YR_META_FILE_NAME in unzipped){

  }
  else {
    // the meta file does not exist, do nothing
    throw Error('missing metadata file')
  }

  for (const [filename, content] of Object.entries(unzipped)) {
    if (filename.endsWith('.json')) {
      try {
        const text = new TextDecoder().decode(content);
        const json = JSON.parse(text);
        results.push({ filename, data: json });
      } catch (err) {
        console.warn(`Failed to parse ${filename}:`, err);
      }
    }
  }

  return results;
}

/**
 * Converts an array of objects to individual JSON files and zips them using fflate.
 * @param {Array<Object>} records - Each object must have a `uuid` property
 * @param {string} modelName - The type of model the data is
 * @param {Object} metadata - Additional metadata
 * @param {int} compressionLevel - The desired compress level
 * @returns {string} - A blob URL you can use to download the zip
 */
export async function zipExport(records, modelName, metadata = {}, compressionLevel = 6) {
  const zipEntries = {};

  for (const record of records) {
    const filename = `${record.uuid || crypto.randomUUID()}.json`;
    const content = JSON.stringify(record, null, 2);
    zipEntries[filename] = new TextEncoder().encode(content);
  }

  // Add metadata file
  zipEntries[YR_META_FILE_NAME] = new TextEncoder().encode(JSON.stringify({
    ...metadata,
    version: chrome.runtime.getManifest().version, // assign the version
    modelName: modelName // assign a model to the output type
  }, null, 2));

  // Create zip
  const zipUint8 = fflate.zipSync(zipEntries, { level: compressionLevel });
  const zipBlob = new Blob([zipUint8], { type: 'application/zip' });

  const blobUrl = URL.createObjectURL(zipBlob);
  return blobUrl;
}