import Mustache from 'mustache';
import { createTab, processNotification } from '../utilities/loaders';
import { getUser } from '../models/schemas/User';

type PluginAction = 'submitForm' | 'singleTask' | 'createTab' | string;

export interface DiscoveryPlugin {
  url: string;
  action: PluginAction;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | string;
  contentTypeHeader?: string | null;
  label?: string;
  fieldMapping?: Record<string, string>;
  // runtime-assigned
  selectorValue?: string | number | null;
  // legacy compatibility
  PluginValue?: string | number | null;
}

export type RapportRecord = Record<string, unknown>;

export type NotificationPayload = {
  title?: string;
  message?: string;
  type?: 'success' | 'danger' | 'info' | 'default' | 'warning' | string;
  [k: string]: unknown;
};

/**
 * Receives the discovery plugin and record. The selectorValue is the value of the selector that was selected by the end user.
 * Throws an error if the user lacks access to discovery plugins.
 * TODO: Add support for API / Configuration variables
 */
export default async function discoveryPluginRunner(
  discoveryPlugin: DiscoveryPlugin,
  rapport: RapportRecord = {},
  selectorValue: string | number | null = null
): Promise<void> {
  const user: any = await getUser();
  if (!user?.isAccessible?.('discoveryPlugin', rapport, discoveryPlugin)) {
    // TODO: notify user feature is only available in the pro model
    throw new Error('Pro License Required');
  }

  // assign the plugin value
  discoveryPlugin.selectorValue = selectorValue;

  Mustache.escape = (text: string) => text;

  const url = Mustache.render(discoveryPlugin.url, discoveryPlugin);

  switch (discoveryPlugin.action) {
    case 'submitForm': {
      const formFields = await _buildObject(discoveryPlugin, rapport);
      _submitForm(discoveryPlugin, formFields, url);
      break;
    }
    case 'singleTask': {
      const formFields = await _buildObject(discoveryPlugin, rapport);
      const data = await _fetchRequest(
        discoveryPlugin,
        formFields,
        url,
        rapport
      );
      if (data) processNotification(data);
      break;
    }
    case 'createTab':
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
  formFields: Record<string, string>,
  url: string
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
  formFields: Record<string, string>,
  url: string
): HTMLFormElement {
  const form = document.createElement('form');
  form.method = discoveryPlugin.method;
  form.action = url;
  form.target = '_blank';
  if (discoveryPlugin.contentTypeHeader) {
    form.enctype = discoveryPlugin.contentTypeHeader;
  }
  form.rel = 'nofollow noopener noreferrer';

  for (const [key, value] of Object.entries(formFields)) {
    const field = document.createElement('input');
    field.name = key;
    field.type = 'hidden';
    field.value = value ?? '';
    form.appendChild(field);
  }
  return form;
}

/**
 * Submit a single fetch request in the foreground
 * Returns a notification payload (normalized) when there is a user-facing message, otherwise void.
 */
async function _fetchRequest(
  discoveryPlugin: DiscoveryPlugin,
  formFields: Record<string, string | File>,
  url: string,
  _record: RapportRecord
): Promise<NotificationPayload | void> {
  const formData = new FormData();
  for (const [key, value] of Object.entries(formFields)) {
    if (value instanceof File) {
      formData.append(key, value, value.name);
    } else {
      formData.append(key, value);
    }
  }

  const headers: Record<string, string> = {};
  let body: BodyInit;

  if (discoveryPlugin.contentTypeHeader === 'application/json') {
    const object: Record<string, unknown> = {};
    formData.forEach((v, k) => {
      // Convert FormDataEntryValue to something JSON-serializable
      object[k] = v instanceof File ? v.name : v;
    });
    body = JSON.stringify(object);
    headers['Content-Type'] = 'application/json';
  } else {
    body = formData;
  }

  const params: RequestInit = {
    method: discoveryPlugin.method,
    headers,
    body,
    mode: 'cors',
  };

  try {
    // TODO: determine if this is running in the service worker or the browser window, to prevent calling
    // TODO: implement in background service worker context
    const promise = fetch(url, params);
    processNotification({
      title: 'Discovery Plugin Request Sent',
      message: 'Waiting for response from the server.',
      type: 'info',
    });

    const response = await promise;

    if (response.ok) {
      processNotification({
        title: 'Discovery Plugin Request Received',
        message:
          'Your request was successfully accepted and data processing has begun.',
        type: 'success',
      });

      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        // assume server returns { title, message, type } or similar
        return data as NotificationPayload;
      } else {
        const text = await response.text();
        if (!text || text === 'ok') {
          return;
        }
        const tab = window.open('about:blank', '_blank', 'noopener,noreferrer');
        if (tab && tab.document) {
          tab.document.write(text);
          tab.document.close();
        }
        return;
      }
    }

    // Handle non-OK responses
    if (response.status >= 400 && response.status < 500) {
      const text = await response.text();
      try {
        const data = JSON.parse(text) as NotificationPayload;
        return {
          title:
            (data as any)?.title ??
            `Server Error from Plugin '${discoveryPlugin.label ?? 'Unknown'}'`,
          message: (data as any)?.message ?? text,
          type: (data as any)?.type ?? 'danger',
        };
      } catch {
        return {
          title: `Server Error from ${discoveryPlugin.label ?? 'Unknown'}`,
          message: text,
          type: 'danger',
        };
      }
    }

    if (response.status === 500) {
      const text = await response.text();
      return {
        title: `Server Error from ${discoveryPlugin.label ?? 'Unknown'}`,
        message: text,
        type: 'danger',
      };
    }
  } catch (error: unknown) {
    let message =
      error instanceof Error ? error.message : 'An unexpected error occurred';
    if (typeof message === 'string' && message.includes('Failed to fetch')) {
      message = `The service provider at ${url} is unreachable, misconfigured or your plugin is not setup correctly`;
    }
    processNotification({
      title: `${discoveryPlugin.label ?? 'Plugin'} Task Failed`,
      message,
      type: 'danger',
    });
  }
}

/**
 * Use Mustache templates to do variable substitution
 */
async function _buildObject(
  discoveryPlugin: DiscoveryPlugin,
  record: RapportRecord = {}
): Promise<Record<string, string | File>> {
  const obj: Record<string, string> = {};
  const mapping = discoveryPlugin.fieldMapping ?? {};
  // substitute in content and case parameters
  for (const [key, value] of Object.entries(mapping)) {
    // static or variables get rendered
    obj[key] = Mustache.render(value, record as any);
  }
  return obj;
}
