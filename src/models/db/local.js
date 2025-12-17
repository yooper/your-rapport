/**
 * Takes a key and javascript object
 * TODO: Add observer pattern to create hooks for actions when specific data elements are saved
 * @param key
 * @param obj
 * @returns {Promise<void>}
 */
export async function setLocalItem(key, obj) {
  let instance = {};
  // TODO: add pre-save hook
  instance[key] = JSON.stringify(obj);
  const result = await chrome.storage.local.set(instance);
  // TODO: add post-save hook
  return result;
}

/**
 * Fetches the value you from the database. Specifying a null key will return all the values in the database, which
 * may not be very performant.
 * @param key
 * @returns {Promise<{}|null|[]|any>}
 */
export async function getLocalItem(key) {
  const value = await chrome.storage.local.get(key);
  if (value) {
    try {
      const data = JSON.parse(value[key]);
      return data;
    } catch (e) {
      return [];
    }
  }
  return [];
}

/**
 * Update a single record in the collection
 * @param key
 * @param idFieldName
 * @param record
 * @returns {Promise<Record[]>}
 */
export async function updateRecord(key, idFieldName, record) {
  let records = (await getLocalItem(key)) ?? [];
  const index = records.findIndex(
    (r) => r[idFieldName] === record[idFieldName]
  );
  if (index !== -1) {
    records[index] = record;
    await setLocalItem(key, records);
  }
  return records;
}

/**
 * add a single record in the collection
 * @param key
 * @param idFieldName
 * @param record
 * @returns {Promise<void>}
 */
export async function addRecord(key, idFieldName, record) {
  let records = (await getLocalItem(key)) ?? [];
  const index = records.findIndex(
    (r) => r[idFieldName] === record[idFieldName]
  );
  // verify the record does not exist
  if (index === -1) {
    records = [record].concat(records);
    await setLocalItem(key, records);
  }
}

/**
 * delete a single record in the collection
 * @param key
 * @param idFieldName
 * @param record
 * @returns {Promise<*[]>}
 */
export async function deleteRecord(key, idFieldName, record) {
  let records = (await getLocalItem(key)) ?? [];
  if (records.length === 0) {
    return [];
  }

  const filtered = records.filter(
    (r) => r[idFieldName] !== record[idFieldName]
  );

  await setLocalItem(key, filtered);
  return filtered;
}

/**
 * delete a single record in the collection
 * @param key
 * @param idFieldName
 * @param record
 * @returns {Promise<*[]>}
 */
export async function deleteBulkRecords(key, idFieldName, records) {
  let localRecords = (await getLocalItem(key)) ?? [];
  if (localRecords.length === 0 || records.length === 0) {
    return localRecords;
  }
  const idsToDelete = new Set(records.map((r) => r[idFieldName]));
  const filtered = localRecords.filter((r) => !idsToDelete.has(r[idFieldName]));

  if (filtered.length !== localRecords.length) {
    await setLocalItem(key, filtered);
  }
  return filtered;
}


