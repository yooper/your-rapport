/**
 * @param excludeKeys
 */
import {isEmptyObj} from "../../common/transformers";

/**
 * Takes a key and javascript object
 * @param key
 * @param obj
 * @returns {Promise<void>}
 */
export async function setLocalItem(key, obj)
{
    let instance = {}
    instance[key] = JSON.stringify(obj)
    return await chrome.storage.local.set(instance);
}


/**
 * Fetches the value you from the database. Specifying a null key will return all the values in the database, which
 * may not be very performant.
 * @param key
 * @returns {Promise<{}|null|any>}
 */
export async function getLocalItem(key)
{
    const value = await chrome.storage.local.get(key)
    if(value){
        //console.log(`key is ${key}, value is ${value}`)
        try{
            if(isEmptyObj(value)){
                return {}
            }
            const data = JSON.parse(value[key])
            return data
        }
        catch(e){
            console.error(`Error parsing: key is ${key}, value is ${JSON.stringify(value)}`)
            return null
        }
    }
    return null
}