import { Store } from 'react-notifications-component';
import { debug } from '../services/logger_services';
import Package from '../models/schemas/Package';
import { db } from '../models/db/dexieDb';

/**
 * Show the loader...
 */
export function showLoader() {
  const loader = document.querySelector('.loader');
  loader.classList.remove('loader--hide');
  const appContainer = document.getElementById('app-container');
  appContainer.classList.add('component--hide');
}

/**
 * Hide the loader
 */
export function hideLoader() {
  const loader = document.querySelector('.loader');
  loader.classList.add('loader--hide');
  const appContainer = document.getElementById('app-container');
  appContainer.classList.remove('component--hide');
}

/**
 * Used to display notifications to the user
 * @param data
 */
export function processNotification(data, duration = 3000) {

  // TODO: handle notifications created in the service worker
  if(typeof window === 'undefined'){
    debug('background runner notification', data);
    return;
  }

  Store.addNotification({
    title: data.title,
    message: data.message,
    type: data.type,
    insert: 'bottom',
    container: 'bottom-right',
    animationIn: ['animate__animated', 'animate__fadeIn'],
    animationOut: ['animate__animated', 'animate__fadeOut'],
    dismiss: {
      duration: data.type === 'danger' ? duration * 2 : duration,
      onScreen: true,
    },
  });
}

export function getDarkTheme() {
  return {
    palette: {
      mode: 'dark',
      primary: {
        main: '#ffe88b',
      },
      secondary: {
        main: '#619657',
      },
      cancel: {
        main: '#E86E69',
      },
    },
  };
}

/**
 * Opens a tab using the chrome api
 * @param url
 * @param onlyOneTabOpen
 * @returns {Promise<void>}
 */
export async function createTab(url, onlyOneTabOpen = false) {
  const openUrls = (await getAllTabUrls()) ?? [];
  if (onlyOneTabOpen && openUrls.find((openUrl) => openUrl == url)) {
    debug('too many urls');
    return;
  }
  await chrome.tabs.create({ url: url });
}

/**
 * Returns the list of urls that are open
 * @returns {Promise<string[]>}
 */
async function getAllTabUrls() {
  const tabs = await chrome.tabs.query({ windowType: 'normal' });
  const urls = tabs
    .map((tab) => {
      return tab.url;
    })
    .filter((u) => u !== undefined);
  return urls;
}

export async function getActiveTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

/**
 * Install a package, which installs the specific discovery plugin
 * @param record {Package}
 * */
export async function installPackage(record) {
  await Package.install(record);
}

export function getSelectorTypeMap() {
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
 * @param instance
 * @param data
 * @returns {*}
 */
export function hydrate(instance, data) {
  for (const key in instance) {
    if (instance.hasOwnProperty(key)) {
      instance[key] = instance[key];
    }
  }
  return instance;
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runWithMinDelay(taskFn) {
  const start = performance.now(); // Start the timer
  await taskFn(); // Run the task (can be sync or async)
  const elapsed = performance.now() - start;
  const remaining = 1500 - elapsed;
  if (remaining > 0) {
    await new Promise((resolve) => setTimeout(resolve, remaining));
  }
  debug(`Finished after ${Math.max(elapsed, 1000).toFixed(0)}ms`);
}

/**
 * Installs a set of default packages
 * @returns {Promise<void>}
 */
export async function initializeDiscoveryPlugins() {

  const count = await db.discoveryPlugin.count();
  if(count > 0){
    debug('Discovery plugins already initialized.');
    return;
  }

  // install the default discovery plugins
  const defaultDiscoveryPlugins = [
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
 * @param xpath
 * @returns {Node|null}
 */
function getElementByXPath(xpath) {
  // Evaluate the XPath against the document
  const result = document.evaluate(
    xpath,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  );
  // Return the node if found
  return result?.singleNodeValue ?? null;
}
