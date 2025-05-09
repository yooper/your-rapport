
/**
 * Takes a key and javascript object
 * TODO: Add observer pattern to create hooks for actions when specific data elements are saved
 * @param key
 * @param obj
 * @returns {Promise<void>}
 */
export async function setLocalItem(key, obj)
{
    let instance = {}
    // TODO: add pre-save hook
    instance[key] = JSON.stringify(obj)
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
export async function getLocalItem(key)
{
    const value = await chrome.storage.local.get(key)
    if(value){
        try{
            const data = JSON.parse(value[key])
            return data;
        }
        catch(e){
            console.error(`Error parsing: key is ${key}, value is ${JSON.stringify(value)}`)
            return null;
        }
    }
    return null;
}

/**
 * Update a single record in the collection
 * @param key
 * @param idFieldName
 * @param record
 * @returns {Promise<void>}
 */
export async function updateRecord(key, idFieldName, record){
    let records = await getLocalItem(key) ?? [];
    const index = records.findIndex(r => r[idFieldName] === record[idFieldName]);
    if(index !== -1){
        records[index] = record;
        await setLocalItem(key, records);
    }
}

/**
 * add a single record in the collection
 * @param key
 * @param idFieldName
 * @param record
 * @returns {Promise<void>}
 */
export async function addRecord(key, idFieldName, record){
    let records = await getLocalItem(key) ?? [];
    const index = records.findIndex(r => r[idFieldName] === record[idFieldName]);
    // verify the record does not exist
    if(index === -1){
        records = [record].concat(records);
        await setLocalItem(key, records);
    }
}

/**
 * delete a single record in the collection
 * @param key
 * @param idFieldName
 * @param record
 * @returns {Promise<void>}
 */
export async function deleteRecord(key, idFieldName, record) {
    let records = await getLocalItem(key) ?? [];
    // Filter out the record to delete
    const filtered = records.filter(r => r[idFieldName] !== record[idFieldName]);

    // Only write if a deletion actually occurred
    if (filtered.length !== records.length) {
        await setLocalItem(key, filtered);
    }
}

