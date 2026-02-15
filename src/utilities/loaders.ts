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
      mode: "dark",
      primary: {
        main: '#fff',
      },
      secondary: {
        main: "#619657",
      },
      info: {
        main: "#ffe88b",
      },
      success: {
        main: "#4CAF50",
        light: "#81C784",
        dark: "#2E7D32",
      },
      warning: {
        main: "#FFB74D",
        light: "#FFD54F",
        dark: "#F57C00",
      },
      error: {
        main: "#F44336",
        light: "#E57373",
        dark: "#D32F2F",
      },

      // custom key used in your app
      // @ts-expect-error - non-standard palette key
      cancel: {
        main: "#E86E69", // your existing coral
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
): Promise<chrome.tabs.Tab|null> {
  const openUrls = (await getAllTabUrls()) ?? [];
  if (onlyOneTabOpen && openUrls.find((openUrl) => openUrl === url)) {
    debug('too many urls', {openUrls});
    return null
  }
  const tab = await chrome.tabs.create({ url });
  return tab;
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
    crypto: 'Crypto Address',
    date: 'Date',
    email: 'Email',
    keyword: 'Keyword',
    name: "Person's Name",
    organization: "Organization's Name",
    phone: 'Phone',
    username: 'Username'
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
