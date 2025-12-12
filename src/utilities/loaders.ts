import { Store } from 'react-notifications-component';
import { debug } from '../services/logger_services';
import Package from '../models/schemas/Package';
import { db } from '../models/db/dexieDb';
import type { ThemeOptions } from '@mui/material/styles';

/**
 * Show the loader...
 */
export function showLoader(): void {
  const loader = document.querySelector<HTMLElement>('.loader');
  const appContainer = document.getElementById('app-container');

  if (loader) {
    loader.classList.remove('loader--hide');
  }
  if (appContainer) {
    appContainer.classList.add('component--hide');
  }
}

/**
 * Hide the loader
 */
export function hideLoader(): void {
  const loader = document.querySelector<HTMLElement>('.loader');
  const appContainer = document.getElementById('app-container');

  if (loader) {
    loader.classList.add('loader--hide');
  }
  if (appContainer) {
    appContainer.classList.remove('component--hide');
  }
}

/**
 * Used to display notifications to the user
 */
export type NotificationType =
  | 'success'
  | 'danger'
  | 'info'
  | 'default'
  | 'warning'

export interface NotificationData {
  title: string;
  message: string;
  type: NotificationType;
}

export function processNotification(
  data: NotificationData,
  duration: number = 3000
): void {
  // TODO: handle notifications created in the service worker
  if (typeof window === 'undefined') {
    debug('background runner notification', data);
    return;
  }

  Store.addNotification({
    title: data.title,
    message: data.message,
    type: data.type,
    insert: 'top',
    container: 'top-left',
    animationIn: ['animate__animated', 'animate__fadeIn'],
    animationOut: ['animate__animated', 'animate__fadeOut'],
    dismiss: {
      duration: data.type === 'danger' ? duration * 2 : duration,
      onScreen: true,
    },
  });
}

export function getDarkTheme(): ThemeOptions {
  return {
    palette: {
      mode: 'dark',
      primary: {
        main: '#ffe88b',
      },
      secondary: {
        main: '#619657',
      },
      // custom key used in your app
      // @ts-expect-error - non-standard palette key
      cancel: {
        main: '#E86E69',
      },
    },
  };
}

/**
 * Opens a tab using the chrome api
 */
export async function createTab(
  url: string,
  onlyOneTabOpen: boolean = false
): Promise<void> {
  const openUrls = (await getAllTabUrls()) ?? [];
  if (onlyOneTabOpen && openUrls.find((openUrl) => openUrl === url)) {
    debug('too many urls', {openUrls});
    return;
  }
  await chrome.tabs.create({ url });
}

/**
 * Returns the list of urls that are open
 */
async function getAllTabUrls(): Promise<string[]> {
  const tabs = await chrome.tabs.query({ windowType: 'normal' });
  const urls = tabs
    .map((tab) => tab.url)
    .filter((u): u is string => u !== undefined);
  return urls;
}

export async function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  const queryOptions: chrome.tabs.QueryInfo = {
    active: true,
    lastFocusedWindow: true,
  };
  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

/**
 * Install a single package, which installs the specific discovery plugin
 */
export async function installPackage(
  record: Package | { url: string }
): Promise<void> {
  await Package.install(record as any);
}

export function getSelectorTypeMap(): Record<string, string> {
  return {
    address: 'Address',
    associate: 'Associate',
    crypto: 'Crypto Address',
    dob: 'Date of Birth',
    date: 'Date',
    email: 'Email',
    event: 'Event',
    family: 'Family',
    keyword: 'Keyword',
    name: 'Name',
    occupation: 'Occupation',
    organization: 'Organization',
    phone: 'Phone',
    religion: 'Religion',
    username: 'Username',
  };
}

/**
 * Hydrate the passed in instance with data object
 */
export function hydrate<T extends object>(
  instance: T,
  data: Partial<T>
): T {
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      (instance as any)[key] = (data as any)[key];
    }
  }
  return instance;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runWithMinDelay(
  taskFn: () => void | Promise<void>
): Promise<void> {
  const start = performance.now();
  await taskFn();
  const elapsed = performance.now() - start;
  const remaining = 1500 - elapsed;
  if (remaining > 0) {
    await new Promise((resolve) => setTimeout(resolve, remaining));
  }
  debug(`Finished after ${Math.max(elapsed, 1000).toFixed(0)}ms`);
}

/**
 * Installs a set of default packages
 */
export async function initializeDiscoveryPlugins(): Promise<void> {
  const count = await db.discoveryPlugin.count();
  if (count > 0) {
    debug('Discovery plugins already initialized.');
    return;
  }

  const defaultDiscoveryPlugins: string[] = [
    'https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/countries/us/sec-edgar.json',
    'https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/countries/us/california/sos-business-search.json',
    'https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/countries/us/illinois/il-sos-biz-search-by-name.json',
    'https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/countries/us/illinois/il-sos-biz-search-by-org.json',
    'https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/countries/us/michigan/lara-by-name.json',
    'https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/countries/us/michigan/lara-by-org-name.json',
    'https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/countries/us/ohio/oh-business-search-by-name.json',
    'https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/countries/us/ohio/oh-business-search-by-org.json',
    'https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/countries/us/wisconsin/wi-corporate-by-org-name.json',
    'https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/fast-people-search/fps-address.json',
    'https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/fast-people-search/fps-phone.json',
    'https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/google/google-in-text-username.json',
    'https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/google/google-in-title-username.json',
    'https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/google/google-in-url-username.json',
    'https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/ngos/open-corporates/oc-search-by-name.json',
    'https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/ngos/open-corporates/oc-search-by-org.json',
    'https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/phones/caller-id.json',
    'https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/phones/experian-phone-verification.json',
    'https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/phones/ipqs-phone-validator.json',
    'https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/phones/phone-validator.json',
    'https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/phones/reverse-phone-checker.json',
    'https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/usernames/whats-my-name.json',
    'https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/usernames/who-am-i.json',
    // domain tools
    'https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/domains/url-scan-io.json',
    'https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/domains/dnslytics.json',
    'https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/domains/censys.json',
    'https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/domains/robtex.json',
    'https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/domains/securitytrails.json',
    'https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/domains/shodan.json',
    'https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/domains/threatminer.json',
    'https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/domains/viewdns.json',
    'https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/domains/virustotal.json',
    'https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/domains/web-archive.json',
    'https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/domains/web-check.json',
    'https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/domains/domainiq.json',
    'https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/domains/built-with.json',
  ];

  for (const pluginUrl of defaultDiscoveryPlugins) {
    try {
      await installPackage({ url: pluginUrl });
    } catch (e) {
      debug(e);
    }
  }
}

/**
 * Check for the xpath
 */
function getElementByXPath(xpath: string): Node | null {
  const result = document.evaluate(
    xpath,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  );
  return result?.singleNodeValue ?? null;
}
