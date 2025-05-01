
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
    let records = await getLocalItem(key);
    const index = records.findIndex(r => r[idFieldName] === record[idFieldName]);
    if(index !== -1){
        records[index] = record;
        await setLocalItem(key, records);
    }
}