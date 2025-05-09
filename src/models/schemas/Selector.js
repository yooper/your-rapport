import {addRecord, deleteRecord, getLocalItem, setLocalItem, updateRecord} from "../db/local";

export class Selector{
    constructor(key, selectorTypeName, description = null) {
        this.key = key;
        this.selectorTypeName = selectorTypeName;
        this.description = description;
    }

    /**
     * @param {Selector}selector
     * @returns {Promise<void>}
     */
    static async add(selector){
        // normalize selector to lower case
        selector.key = selector.key.toLowerCase();
        await addRecord('selectors', 'key', selector);
        // scan the existing records
        let records = await getLocalItem('screenshots') ?? [];
        await Selector._findMatches(records, [selector]);
    }


    /**
     *
     * @param {Selector}selector
     * @returns {Promise<void>}
     */
    static async delete(selector){
        await deleteRecord('selectors', 'key', selector);
        let records = await getLocalItem('screenshots') ?? [];
        for(let record of records){
            record.selectors = record.selectors.filter(item => item.key === selector.key)
        }
        await setLocalItem('screenshots', records);
    }


    static async _findMatches(records, selectors) {
        for (const record of records) {
            let matches = [];
            for(const selector of selectors){
                if(record.text?.includes(selector.key)){
                    matches.push(selector);
                }
            }
            record.selectors = matches;
            await updateRecord('screenshots', 'uuid', record)
        }
    }
}