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