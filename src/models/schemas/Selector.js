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
        selector.key = selector.key.toLowerCase().trim();
        await addRecord('selectors', 'key', selector);
        // scan the existing records
        let records = await getLocalItem('rapports') ?? [];
        await Selector._findMatches(records, [selector]);
    }


    /**
     *
     * @param {Selector}selector
     * @returns {Promise<void>}
     */
    static async delete(selector){
        await deleteRecord('selectors', 'key', selector);
        let records = await getLocalItem('rapports') ?? [];
        for(let record of records){
            record.selectors = record.selectors.filter(item => item.key === selector.key)
        }
        await setLocalItem('rapports', records);
    }


    /***
     * Iterate through the records looking for the given selectors
     * @param records
     * @param selectors
     * @returns {Promise<void>}
     * @private
     */
    static async _findMatches(records, selectors) {
        for (const record of records) {
            const text = (record.text ?? '') + ' ' + record.title.toLowerCase();
            let matches = [];
            for(const selector of selectors){
                if(text.includes(selector.key)){
                    matches.push(selector);
                }
            }
            //Compare the new and old results. If the lists are the same skip calling update
            if(record.selectors.length === matches.length){
                continue;
            }
            record.selectors = record.selectors.concat(matches);
            updateRecord('rapports', 'uuid', record).then(async() => {
                const configurationRegistry = await getLocalItem('configuration');
                configurationRegistry.lastSavedOn = Date.now().toString();
                await setLocalItem('configuration', configurationRegistry);
            });
        }
    }
}