import Mustache from "mustache/mustache.mjs";
import {createTab, processNotification} from "../utilities/loaders";
import {getUser} from "../models/schemas/User";


/**
 * Receives the discovery plugin and record. The selectedValue is the value of the selector that was selected by the end user.
 * Throws an error
 * TODO: Add support for API / Configuration variables
 * @param discoveryPlugin {DiscoveryPlugin}
 * @param rapport
 * @param pluginValue{string|number|null}
 * @returns {Promise<void>}
 */
export default async function discoveryPluginRunner(discoveryPlugin, rapport = {}, pluginValue = null)
{
    const user = await getUser();
    if(!user.isAccessible('discoveryPlugin', rapport, discoveryPlugin)){
        // TODO notify user feature is only available in the pro model
        throw new Error("Pro License Required");
    }

    // assign the plugin value
    discoveryPlugin.pluginValue = pluginValue;
    // To support the legacy Mustache markup add this property to the discovery plugin
    discoveryPlugin.PluginValue = pluginValue;

    Mustache.escape = function (text) { return text; }
    let formFields = null;
    const url = Mustache.render(discoveryPlugin.url, discoveryPlugin);
    switch(discoveryPlugin.action){
        case 'submitForm':
            formFields = await _buildObject(discoveryPlugin, rapport)
            _submitForm(discoveryPlugin, formFields, url)
            break;
        case 'singleTask':
            formFields = await _buildObject(discoveryPlugin, rapport)
            const data = await _fetchRequest(discoveryPlugin, formFields, url, rapport)
            processNotification(data)
            break;
        case 'createTab':
        default:
            const encodedUri = encodeURI(url)
            createTab(encodedUri);
            break;
    }
}


/**
 * Submits an HTMLFormElement to an url
 * @param discoveryPlugin{DiscoveryPlugin}
 * @param formFields
 * @param url
 * @private
 */
function _submitForm(discoveryPlugin, formFields, url)
{
    const form = _createForm(discoveryPlugin, formFields, url)
    document.body.appendChild(form)
    form.submit()
    form.remove()
}

/**
 * Build a form object to be submitted
 * @param discoveryPlugin{DiscoveryPlugin}
 * @param formFields
 * @param url
 * @returns {HTMLFormElement}
 * @private
 */
function _createForm(discoveryPlugin, formFields, url)
{
    const form = document.createElement('form');
    form.method = discoveryPlugin.method;
    form.action = url;
    form.target = '_blank';
    form.enctype = discoveryPlugin.contentTypeHeader;
    form.rel = 'nofollow noopener noreferrer';
    for(const [key, value] of Object.entries(formFields))
    {
        const field = document.createElement('input')
        field.name = key
        field.type = 'hidden'
        field.value = value;
        form.appendChild(field);
    }
    return form;
}

/**
 * Submit a single fetch request in the foreground
 * TODO: make a background/service runner
 * @param discoveryPlugin{DiscoveryPlugin}
 * @param formFields
 * @param url
 * @param record
 * @private
 */
async function _fetchRequest(discoveryPlugin, formFields, url, record)
{
    const formData = new FormData()
    for (const [key, value] of Object.entries(formFields)) {
        if(value instanceof File){
            formData.append(key, value, value.name)
        }
        else{
            formData.append(key, value)
        }
    }

    let params = {
        method: discoveryPlugin.method
    }

    let headers = {}
    let body
    if(discoveryPlugin.contentTypeHeader === 'application/json'){
        let object = {}
        formData.forEach((value, key) => object[key] = value)
        body = JSON.stringify(object)
        headers["Content-Type"] = "application/json"
    }
    else
    {
        body = formData
    }

    params['body'] = body
    params['headers'] = headers
    params['mode'] = 'cors'

    try {
        // TODO: determine if this is running in the service worker or the browser window, to prevent calling
        // TODO: implement in background service worker context
        const promise = fetch(url, params)
        processNotification({ title: 'Discovery Plugin Request Sent', message: 'Waiting for response from the server.', type: 'info'})
        const response = await promise
        if (response.ok)
        {
           processNotification({title: 'Discovery Plugin Request Received', message:'Your request was successfully accepted and data processing has begun.', type:'success'})
           const contentType = response.headers.get("content-type");
           if (contentType && contentType.indexOf("application/json") !== -1)
           {
               return response.json().then(async (data) => {
                   processNotification(data)
               })
           }
           else
           {
               return response.text().then(text => {
                   if(!text || text === 'ok'){
                       return
                   }
                   const tab = window.open('about:blank', '_blank', "noopener,noreferrer");
                   tab.document.write(text);
                   tab.document.close();
               });
           }
        }
        else if (response.status >= 400 && response.status < 500)
        {
            const text = await response.text()
            let data = text
            try
            {
                data = JSON.parse(text)
                data.title = 'title' in data ? data['title'] : `Server Error from Plugin '${discoveryPlugin.label}'`
                data.message = 'message' in data ? data['message'] : text
                data['type'] = 'type' in data ? data['type'] : 'danger'
                return data
            }
            catch(e)
            {
                return {
                    title: `Server Error from ${discoveryPlugin.label}`,
                    message: text,
                    type: 'danger'
                }
            }

        }
        else if (response.status === 500)
        {
            const text = await response.text()
            return {
                title: `Server Error from ${discoveryPlugin.label}`,
                message: text,
                type: 'danger'
            }
        }
    }
    catch(error)
    {
       let message = error.message
       if(message.includes('Failed to fetch')){
           message = `The service provider at ${url} is unreachable, misconfigured or your plugin is not setup correctly`
       }
       processNotification({
           title: `${discoveryPlugin.label} Task Failed`,
           message: message,
           type: "danger"
       })
    }
}

/**
 * Use Mustache templates to do variable substitution
 * @param discoveryPlugin
 * @param configurations
 * @param record
 * @param pluginValue
 * @returns {Promise<{}>}
 * @private
 */
async function _buildObject(discoveryPlugin, record = {})
{
    let obj = {}
    // substitute in content and case parameters
    for (const [key, value] of Object.entries(discoveryPlugin.fieldMapping)) {
        // static or variables get rendered
        obj[key] = Mustache.render(value, record)
    }
    return obj
}
