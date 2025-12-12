import Mustache from 'mustache';
import { createTab, processNotification } from '../utilities/loaders';
import { getUser } from '../models/schemas/User';
import { DiscoveryPlugin } from '../models/schemas/DiscoveryPlugin';
import { ApiKey, IRapport } from '../types';
import { base64ToFile, downloadBase64Image, downloadJsonData, safeJsonParse } from '../utilities/transformers';
import { printPdfReport } from '../utilities/print_service';
import { db } from '../models/db/dexieDb';
import { debug } from './logger_services';
import { Artifact } from '../models/schemas/Artifact';
import { updateRecord } from '../models/db/local';
import { getJobQueue} from '../pages/Background/index'
import { RAPPORT, UUID } from './constants';


/**
 * Receives the discovery plugin and record. The selectorValue is the value of the selector that was selected by the end user.
 * Throws an error if the user lacks access to discovery plugins.
 */
export async function discoveryPluginRunner(
  discoveryPlugin: DiscoveryPlugin,
  rapport: IRapport,
  selectorValue: string | number | null = null
): Promise<void> {
  const user: any = await getUser();

  if (!user?.isAccessible?.('discoveryPlugin', rapport, discoveryPlugin)) {
    // TODO: notify user feature is only available in the pro model
    //throw new Error('Pro License Required');
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

  const apiKeysObj = apiKeys.reduce(
    (obj, item) => Object.assign(obj, { [item.key]: item.value }), {});

  // TODO: refactor the way vars are flattened
  const url = Mustache.render(discoveryPlugin.url,{...discoveryPlugin, ...rapport, ...apiKeysObj});

  switch (discoveryPlugin.action) {
    case 'SubmitForm': {
      const formFields = await _buildObject(discoveryPlugin, rapport, apiKeys);
      _submitForm(discoveryPlugin, formFields, url);
      break;
    }
    case 'BackgroundRunner':
    case 'ForegroundRunner':
      const formFields = await _buildObject(discoveryPlugin, rapport, apiKeys);
      _processFetch(discoveryPlugin, formFields, url, rapport);
      break;

    case 'CreateTab':
    default: {
      // TODO
      const encodedUri = encodeURI(url);
      createTab(encodedUri);
      break;
    }
  }
}

/**
 * Process the fetch request and attach the response as an artifact
 * @param discoveryPlugin
 * @param formFields
 * @param url
 */
async function _processFetch(
  discoveryPlugin: DiscoveryPlugin,
  formFields: Record<string, string | File>,
  url: string,
  rapport: IRapport
): Promise<any> {
  // Build body and initial headers
  const { body, headers } = _buildBodyAndHeaders(discoveryPlugin, formFields);

  // Auth
  const auth = await _buildAuthHeader(discoveryPlugin);
  if (auth) headers.set('Authorization', auth);

  // Custom headers from plugin
  if (discoveryPlugin.headers) {
    const apiKeys = await db.apiKey.toArray();
    const apiKeysObj = apiKeys.reduce(
      (obj, item) => Object.assign(obj, { [item.key]: item.value }), {});

    for (const [k, v] of Object.entries(discoveryPlugin.headers)) {
      if (v != null) headers.set(k, Mustache.render(v, apiKeysObj));
    }
  }

  const method = discoveryPlugin.method || 'GET';
  const requestInit: RequestInit = {
    method,
    headers
  };

  if(method !== 'GET'){
    requestInit.body = body;
  }


  try {

    processNotification({
      title: 'Discovery Plugin Request Sent',
      message: 'Waiting for response from the server.',
      type: 'info',
    });

    const response = await fetch(url, requestInit);

    if (response.ok) {
      processNotification({
        title: 'Discovery Plugin Request Received',
        message: 'Your request was successfully accepted and data processing has begun.',
        type: 'success',
      });

      // TODO: implement a mime type reader, since we shouldn't trust the source
      const contentType = response.headers.get('content-type') || '';
      // attach the results as an artifact of the rapport
      const artifact = await Artifact.create(await response.blob(), rapport.uuid, url, contentType);
      // add the artifact
      await db.artifact.add(artifact)
      rapport.artifacts.push(Artifact.getAttachment(artifact));
      await updateRecord(RAPPORT, UUID, rapport);
      return; // finish processing
    }

    // 4xx
    else if (response.status >= 400 && response.status < 500) {
      const text = await response.text();
      const parsed = safeJsonParse<any>(text);

      // add error artifact
      const artifact = await Artifact.create(new Blob([text], { type: 'text/plain' }), rapport.uuid, url, 'text/plain');
      await db.artifact.add(artifact)
      rapport.artifacts.push(Artifact.getAttachment(artifact));
      await updateRecord(RAPPORT, UUID, rapport);

      if (parsed.ok && parsed.value && typeof parsed.value === 'object') {
        processNotification({
          title: `HTTP 400 Error from ${discoveryPlugin.label ?? 'Plugin'}`,
          message: text,
          type: 'danger',
        })
      }
      processNotification({
        title: `Server Error from ${discoveryPlugin.label ?? 'Plugin'}`,
        message: text,
        type: 'danger',
      });
    }

    // 5xx and others
    const text = await response.text();
    processNotification({
      Title: `Server Error from ${discoveryPlugin.label ?? 'Plugin'}`,
      Message: text || `HTTP ${response.status}`,
      Type: 'danger',
    });
  }
  catch (error: any) {
    await debug(String(error))
    let message: string = error?.message || String(error);
    if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
      message = `The service provider at ${url} is unreachable, misconfigured, or your plugin is not set up correctly.`;
    }
    processNotification({
      title: `${discoveryPlugin.label ?? 'Discovery Plugin'} Runner Failed`,
      message: message,
      type: 'danger',
    });
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
 * Use Mustache templates to do variable substitution.
 */
async function _buildObject(
  discoveryPlugin: DiscoveryPlugin,
  rapport: IRapport,
  apiKeys: ApiKey[]
): Promise<Record<string, string | File>> {

  const obj: Record<string, string | File> = {};
  const apiKeysObj = apiKeys.reduce(
    (obj, item) => Object.assign(obj, { [item.key]: item.value }), {});

  const mergedRecords: Record<string, any> = {...rapport, ...apiKeysObj}

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
        const recordObj: Record<string, any> = { ...rapport };
        // handle error in calling function
        // TODO: add custom error object
        if (!['mhtml'].includes(fieldName) && (!(fieldName in recordObj) || !recordObj[fieldName])) {
          throw new Error(`Field Name ${fieldName} does not exist in the rapport ${rapport.uuid}`)
        }

        // screenshot specific conversion for making the screenshot downloadable
        if(fieldName === 'screenshot'){
          obj[key] = base64ToFile(recordObj[fieldName], `rapport.uuid.${fieldName}.png`)
        }
        // special case for mhtml instances
        else if(fieldName === 'mhtml'){
          // there must only be one mhtml record
          const found = rapport.artifacts.find(a => a.mimeType === 'multipart/related') || null;
          if(!found){
            throw new Error('Rapport has no associated MHTML artifact.');
          }
          const mhtml = await db.artifact.get(found.uuid);
          if (mhtml?.data instanceof Blob){
              obj[key] = new File([mhtml.data], `rapport.${rapport.uuid}.mhtml`, {type: 'multipart/related'});
            }
            else{
              throw new Error('This Rapport mhtml error')
            }
        }
        else {
          // convert everything else to a text file
          obj[key] = new File([recordObj[fieldName]], `rapport.${rapport.uuid}.txt`, {type: "text/plain"});
        }
      }
      else if(['base64'].includes(contentType)){
        const recordObj: Record<string, any> = { ...rapport };
        if(fieldName === 'screenshot'){
          const [prefix, base64] = recordObj[fieldName].includes(',')
            ? recordObj[fieldName].split(',')
            : [null, recordObj[fieldName]];
          obj[key] = base64;
        }
        else{
          obj[key] = atob(recordObj[fieldName])
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

function _buildBodyAndHeaders(
  dp: DiscoveryPlugin,
  formFields: Record<string, any>
): { body: BodyInit | null; headers: Headers } {
  const headers = new Headers();

  if (dp.contentTypeHeader === 'application/json') {
    // For JSON, assume there are no File objects; if there are, caller should not request JSON.
    const payload: Record<string, any> = {};
    for (const [k, v] of Object.entries(formFields)) {
      // Drop undefined; keep null; stringify non-File values
      if (v === undefined) continue;
      if (v instanceof File) {
        // If this happens, JSON is probably not appropriate—serialize minimal metadata.
        payload[k] = { name: v.name, size: v.size, type: v.type };
      } else {
        payload[k] = v;
      }
    }
    headers.set('Content-Type', 'application/json');
    return { body: JSON.stringify(payload), headers };
  }

  // Default to multipart/form-data
  const fd = new FormData();
  for (const [k, v] of Object.entries(formFields)) {
    if (v === undefined) continue;
    if (v instanceof File) {
      fd.append(k, v, v.name);
    } else if (Array.isArray(v)) {
      // Append arrays with index: field[0], field[1], ...
      v.forEach((item, idx) => fd.append(`${k}[${idx}]`, item ?? ''));
    } else if (v !== null && typeof v === 'object') {
      // For objects, append as JSON string
      fd.append(k, JSON.stringify(v));
    } else {
      fd.append(k, String(v ?? ''));
    }
  }
  return { body: fd, headers };
}


/**
 * @param dp
 */
async function _buildAuthHeader(dp: DiscoveryPlugin): Promise<string | undefined> {

  const apiKeys = await db.apiKey.toArray();
  const apiKeysObj = apiKeys.reduce(
    (obj, item) => Object.assign(obj, { [item.key]: item.value }), {});

  // Bearer takes precedence if both are present
  if (dp.authorizationBearerToken) {
    const token = Mustache.render(`${dp.authorizationBearerToken}`, apiKeysObj);
    return `Bearer ${token}`;
  }
  if (dp.authorizationUserName && dp.authorizationPassword) {
    const user = Mustache.render(`${dp.authorizationUserName}`, apiKeysObj);
    const pass = Mustache.render(`${dp.authorizationPassword}`, apiKeysObj);
    const basic = btoa(`${user}:${pass}`);
    return `Basic ${basic}`;
  }
  return undefined;
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
      description: 'Download a JSON file that has all the metadata. Great for sharing with others.',
      onClick: (record: IRapport) =>
      {
        downloadJsonData(record, `your.rapport.dp.${record.uuid}.json`);
      }
    }),
    new DiscoveryPlugin({
      uuid: '8d18fd15-4bb0-4861-ad7f-02a672c9ac20',
      label: 'Download Screenshot',
      pluginType: 'content',
      description: 'Download the screenshot to your computer.',
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
      description: 'Print a PDF report that includes the metadata',
      onClick: (record: IRapport) =>
      {
        printPdfReport('basic', { records: [record] });
      }
    })
  ]
}

/**
 * Once a rapport is saved, iterate through the active background runners and queue
 * them for running
 * @param rapport
 */
export async function applyBackgroundJobs(rapport: IRapport) : Promise<void> {
  const plugins = await db.discoveryPlugin.filter(dp => dp.active && dp.action === 'BackgroundRunner').toArray();
  for ( const discoveryPlugin of plugins){
    await debug('Queuing job', {discoveryPlugin, rapport});
    getJobQueue().enqueue({ discoveryPlugin, rapport })
  }
}
