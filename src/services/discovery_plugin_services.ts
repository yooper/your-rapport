import Mustache from 'mustache';
import { createTab, processNotification } from '../utilities/loaders';
import { getUser } from '../models/schemas/User';
import { DiscoveryPlugin } from '../models/schemas/DiscoveryPlugin';
import { ApiKey, IRapport, NotificationPayload } from '../types';
import { base64ToFile, downloadBase64Image, downloadJsonData } from '../utilities/transformers';
import { printPdfReport } from '../utilities/print_service';
import { db } from '../models/db/dexieDb';
import { debug } from './logger_services';


/**
 * Receives the discovery plugin and record. The selectorValue is the value of the selector that was selected by the end user.
 * Throws an error if the user lacks access to discovery plugins.
 * TODO: Add support for API / Configuration variables
 */
export async function discoveryPluginRunner(
  discoveryPlugin: DiscoveryPlugin,
  rapport: IRapport,
  selectorValue: string | number | null = null
): Promise<void> {
  const user: any = await getUser();

  if (!user?.isAccessible?.('discoveryPlugin', rapport, discoveryPlugin)) {
    // TODO: notify user feature is only available in the pro model
    throw new Error('Pro License Required');
  }

  // assign the plugin value
  discoveryPlugin.selectorValue = selectorValue;

  const apiKeys = await db.apiKey.toArray();

  // runs the custom integration
  if(discoveryPlugin.onClick){
    discoveryPlugin.onClick(rapport);
    return; // stop processing the request
  }

  Mustache.escape = (text: string) => text;

  const url = Mustache.render(discoveryPlugin.url, discoveryPlugin);

  switch (discoveryPlugin.action) {
    case 'SubmitForm': {
      const formFields = await _buildObject(discoveryPlugin, rapport, apiKeys);
      _submitForm(discoveryPlugin, formFields, url);
      break;
    }
    case 'ForegroundRunner': {
      const formFields = await _buildObject(discoveryPlugin, rapport, apiKeys);
      const data = await _fetchRequest(
        discoveryPlugin,
        formFields,
        url,
        rapport
      );
      if (data) processNotification(data);
      break;
    }
    case 'CreateTab':
    default: {
      const encodedUri = encodeURI(url);
      createTab(encodedUri);
      break;
    }
  }
}

/**
 * Submits an HTMLFormElement to an url
 */
function _submitForm(
  discoveryPlugin: DiscoveryPlugin,
  formFields: Record<string, string | File>,
  url: string,
): void {
  const form = _createForm(discoveryPlugin, formFields, url);
  document.body.appendChild(form);
  form.submit();
  form.remove();
}

/**
 * Build a form element to be submitted
 */
function _createForm(
  discoveryPlugin: DiscoveryPlugin,
  formFields: Record<string, string | File>,
  url: string
): HTMLFormElement {
    const form = document.createElement('form')
    form.method = discoveryPlugin.method
    form.action = url
    form.target = '_blank'
    form.enctype = discoveryPlugin.contentTypeHeader ?? ''
    form.rel = 'nofollow noopener noreferrer'
    for(const [key, value] of Object.entries(formFields))
    {
        const field = document.createElement('input')
        field.name = key
        if(value instanceof File) {
          field.type = 'file'
          let container = new DataTransfer()
          container.items.add(value)
          field.files = container.files
        }
        else
        {
          field.type = 'hidden'
          field.value = value;
        }
        form.appendChild(field);
    }
    return form
}

/**
 * Use Mustache templates to do variable substitution
 */
async function _buildObject(
  discoveryPlugin: DiscoveryPlugin,
  record: IRapport,
  apiKeys: ApiKey[]
): Promise<Record<string, string | File>> {

  const obj: Record<string, string | File> = {};
  const apiKeysObj = apiKeys.reduce(
    (obj, item) => Object.assign(obj, { [item.key]: item.value }), {});

  const mergedRecords: Record<string, any> = {...record, ...apiKeysObj}

  const mapping = {...discoveryPlugin.fieldMapping ?? {}};

  // substitute in content and case parameters
  for (const [key, value] of Object.entries(mapping)) {
    if(!value.startsWith('{{') || !value.endsWith('}}')){
      // it is a literal value
      obj[key] = Mustache.render(value, mergedRecords)
    }
    else{ // transform form the template name into the actual variable value
      const fieldNameAttribute = value.replace(/\{\{(.*?)\}\}/g, '$1');
      let fieldName = fieldNameAttribute;
      let contentType = null // the user specified the output file format type
      // split by field name and the type of data to be sent
      if(fieldNameAttribute.indexOf('.') > 0){
        const parts = fieldNameAttribute.split('.');
        fieldName = parts[0];
        contentType = parts[1];
      }

      // no mime type change required for the data
      if(!contentType && fieldName in mergedRecords){
        obj[key] = Mustache.render(value, mergedRecords)
      }
      // TODO, handle edge cases
      else if(['file'].includes(contentType)) {
        const recordObj: Record<string, any> = { ...record };
        // handle error in calling function
        // TODO: add custom error object
        if (!(fieldName in recordObj) || !recordObj[fieldName]) {
          throw new Error(`Field Name ${fieldName} does not exist in the record ${record.uuid}`)
        }

        // screenshot specific conversion
        if(fieldName === 'screenshot'){
          obj[key] = base64ToFile(recordObj[fieldName], `rapport.uuid.${fieldName}.png`)
        }
        // special case for mhtml instances
        else if(fieldName === 'mhtml'){
          // there must only be one mhtml record
          const mhtmls = db.artifact.where('rapportUuid').equals(record.uuid)
            .filter((a => a.mimeType === 'multipart/related'));
          const count = await mhtmls.count()
          if(count === 0){
            throw new Error('Rapport has no associated MHTML artifact.');
          }
          else if(count > 1){
            throw new Error('This Rapport record has more than one MHTML artifact, which is invalid.')
          }
          else{
            // convert to a file
            const fileRecord = await mhtmls.first() || null;
            if (fileRecord?.data instanceof Blob){
              obj[key] = new File([fileRecord.data], `rapport.${record.uuid}.mhtml`, {type: "text/plain"});
            }
            else{
              throw new Error('This Rapport record has no data in the mhtml record space.')
            }
          }
        }
        else{
          // convert everything else
          obj[key] = new File([recordObj[fieldName]], `rapport.${record.uuid}.txt`, {type: "text/plain"});
        }


      }
      // the field name doesn't exist, but may be part of the expanded attributes
      // or data artifacts..
      // TODO: add support for exporting artifacts
      else{
        debug(`Unknown variable ${value}`)
      }
    }
  }
  return obj;
}

/**
 * TODO: Map complex discovery plugins and their click handler
 */
export function getIntegratedPlugins() : DiscoveryPlugin[]
{
  // these plugins are not validated because they are invalid
  return [
    new DiscoveryPlugin({
      uuid: '7d18fd15-4bb0-4861-ad7f-02a672c9ac20',
      label: 'Download Record',
      pluginType: 'content',
      onClick: (record: IRapport) =>
      {
        downloadJsonData(record, `your.rapport.${record.uuid}.json`);
      }
    }),
    new DiscoveryPlugin({
      uuid: '8d18fd15-4bb0-4861-ad7f-02a672c9ac20',
      label: 'Download Screenshot',
      pluginType: 'content',
      onClick: (record: IRapport) =>
      {
        if(record.screenshot){
          downloadBase64Image(record.screenshot, `${record.uuid}.png`);
        }
      }
    }),
    new DiscoveryPlugin({
      uuid: '0d18fd15-4bb0-4861-ad7f-02a672c9ac20',
      label: 'Print Rapport',
      pluginType: 'content',
      onClick: (record: IRapport) =>
      {
        printPdfReport('basic', { records: [record] });
      }
    })
  ]
}
