import { Store } from 'react-notifications-component'
import {convertKeysToCamelCase} from "./transformers";
import {addRecord} from "../models/db/local";


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
export function processNotification(data, duration = 5000)
{
  Store.addNotification({
      title: data.title,
      message: data.message,
      type: data.type,
      insert: "top",
      container: "top-right",
      animationIn: ["animate__animated", "animate__fadeIn"],
      animationOut: ["animate__animated", "animate__fadeOut"],
      dismiss: {
        duration: duration,
        onScreen: true
      }
  })
}

export function getDarkTheme()
{
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
            }
        }
    }
}

/**
 * Opens a tab using the chrome api
 * @param url
 * @param onlyOneTabOpen
 * @returns {Promise<void>}
 */
export async function createTab(url, onlyOneTabOpen = false)
{
  const openUrls = await getAllTabUrls() ?? []
  if(onlyOneTabOpen && openUrls.find(openUrl => openUrl == url)){
    return;
  }
  await chrome.tabs.create({url: url})
}

/**
 * Returns the list of urls that are open
 * @returns {Promise<string[]>}
 */
async function getAllTabUrls() {
    const tabs = await chrome.tabs.query({ windowType:'normal'})
    const urls = tabs.map( tab => { return tab.url }).filter(u => u !== undefined)
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
export async function installPackage(record){
  const response = await fetch(record.url);
  const data = await response.json();
  const dp = convertKeysToCamelCase(data);
  // doesn't overwrite the existing record if it exists
  await addRecord('discoveryPlugins', 'uuid', dp);
}


export function getSelectorTypeMap(){
    return {
        'address': 'Address',
        'associate': 'Associate',
        'crypto': 'Crypto Address',
        'dob': 'Date of Birth',
        'date': 'Date',
        'email': 'Email',
        'event': 'Event',
        'family': 'Family',
        'keyword': 'Keyword',
        'name': 'Name',
        'occupation': 'Occupation',
        'organization': 'Organization',
        'phone': 'Phone',
        'religion': 'Religion',
        'username': 'Username'
    }
}


export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function initializeDiscoveryPlugins(){
    // install the default discovery plugins
    const defaultDiscoveryPlugins = [
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/countries/us/sec-edgar.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/countries/us/california/sos-business-search.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/countries/us/illinois/il-sos-biz-search-by-name.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/countries/us/illinois/il-sos-biz-search-by-org.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/countries/us/michigan/lara-by-name.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/countries/us/michigan/lara-by-org-name.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/countries/us/ohio/oh-business-search-by-name.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/countries/us/ohio/oh-business-search-by-org.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/countries/us/wisconsin/wi-corporate-by-org-name.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/domains/url-scan-io.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/fast-people-search/fps-address.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/fast-people-search/fps-phone.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/github/gh-save-screenshot.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/google/google-in-text-username.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/google/google-in-title-username.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/google/google-in-url-username.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/ngos/open-corporates/oc-search-by-name.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/ngos/open-corporates/oc-search-by-org.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/phones/caller-id.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/phones/experian-phone-verification.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/phones/ipqs-phone-validator.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/phones/phone-validator.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/phones/reverse-phone-checker.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/usernames/whats-my-name.json",
      "https://raw.githubusercontent.com/osint-liar/public-packages/develop/discovery-plugins/usernames/who-am-i.json"
    ];
    await Promise.all(defaultDiscoveryPlugins.map(pluginUrl => {
        installPackage({url: pluginUrl}).catch(err => {
        })
    }))
}
