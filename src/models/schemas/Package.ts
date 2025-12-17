// Package.ts
import { db } from '../db/dexieDb';
import { debug } from '../../services/logger_services';
import { DiscoveryPlugin } from './DiscoveryPlugin';
import { installPackage } from '../../utilities/loaders';
import { Configuration, IConfiguration } from './Configuration';

export interface PackageInit {
  name: string;
  uuid: string;
  label?: string | null;
  version?: string | null;
  description?: string | null;
  updatedOn?: string | Date | null;
  sha256?: string | null;
  url: string;              // where the JSON is hosted
  type?: string | null;
  country?: string | null;
  action: string
  pluginType: string
}

export class Package {
  name: string;
  uuid: string;
  label: string | null;
  version: string | null;
  description: string | null;
  updatedOn: Date | null;
  sha256: string | null;
  url: string;
  type: string | null;
  country: string | null;
  action: string
  pluginType: string

  constructor(data: PackageInit) {
    this.name = data.name;
    this.uuid = data.uuid;
    this.label = data.label ?? null;
    this.version = data.version ?? null;
    this.description = data.description ?? null;
    this.updatedOn =
      data.updatedOn instanceof Date
        ? data.updatedOn
        : data.updatedOn
        ? new Date(data.updatedOn)
        : null;
    this.sha256 = data.sha256 ?? null;
    this.url = data.url;
    this.type = data.type ?? null;
    this.country = data.country ?? null;
    this.action = data.action;
    this.pluginType = data.pluginType;

  }

  /**
   * Fetch the discovery plugins based off the list provided. This function bulkFetchWithLimit managers the connections so resources are not
   * over utilized.
   * @param packages
   */
  static async bulkUpsert(discoveryPlugins: DiscoveryPlugin[]){
    const results = await bulkFetchWithLimit(discoveryPlugins, { concurrency: 10 });
    const plugins = results.filter(r => r.ok).map(f => f.data)
    plugins.forEach(p => {
      if(p.pluginType === 'BackgroundRunner'){
        p.active = false;
      }
    });
    await debug(`${plugins.length} need to be installed or updated`, plugins);
    await db.discoveryPlugin.bulkPut(plugins);
  }


  /**
   * Install the package by fetching its JSON and adding it to the discoveryPlugin table.
   */
  static async install(record: Package): Promise<void> {
    const res = await fetch(record.url, { method: 'GET' });
    if (!res.ok) {
      await debug(`Failed to fetch package from ${record.url}: ${res.status} ${res.statusText}`)
      return;
    }

    const dp: DiscoveryPlugin = await res.json();

    // ALWAYS disable background runner plugins by default
    if(dp.action === 'BackgroundRunner'){
      dp.active = false;
    }
    await db.discoveryPlugin.put(dp);
  }
}

async function bulkFetchWithLimit(discoveryPlugins: DiscoveryPlugin[], { concurrency = 5 } = {}) {
  const results = new Array(discoveryPlugins.length); // preserve original order
  let index = 0;

  async function worker() {
    while (true) {
      // Grab the next index atomically
      const currentIndex = index++;
      if (currentIndex >= discoveryPlugins.length) break;

      const _package: Package = discoveryPlugins[currentIndex];

      try {
        const res = await fetch(_package.url);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        results[currentIndex] = { ok: true, _package, data };
      } catch (err) {
        results[currentIndex] = {
          ok: false,
          _package,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }
  }

  const workerCount = Math.min(concurrency, discoveryPlugins.length);
  const workers = Array.from({ length: workerCount }, () => worker());

  // Wait for all workers to finish
  await Promise.all(workers);
  return results;
}


/**
 * This is the top level command for handling package management such installation and updating of the discovery plugins.
 * The background runner plugins must always be set to inactive due to security/trust issues with rogue modules.
 */
export async function fetchPackages() {
  let data = []

  try {
    const cacheHashResponse = await fetch(
      'https://raw.githubusercontent.com/osint-liar/public-packages/develop/index.json.hash'
    );

    const configuration: IConfiguration = await Configuration.getConfiguration();
    const newHashCache = await cacheHashResponse.text();
    const oldHashCache = configuration.packageCacheEnabled ? configuration.packageCacheHash : '';
    let data: Package[] = []
    if(!oldHashCache || newHashCache !== oldHashCache){
      const response = await fetch(
        'https://raw.githubusercontent.com/osint-liar/public-packages/develop/index.json'
      );
      const packageData: Package[] = await response.json();
      data = structuredClone(packageData);
      configuration.packageCacheHash = newHashCache;
    }
    else{
      // no updated available
      data = [];
      debug('no packages to update or install');
      return;
    }

    // update package cache hash
    await Configuration.setConfiguration(configuration);

    // convert the data to camelCase and filter legacy middleware
    const externalPackages = data.filter(
      (r) => r.action !== 'Middleware'
    );

    const localPackages = await db.discoveryPlugin.toArray();
    externalPackages.forEach((ep) => (ep.action = 'install'));

    const discoveryPluginQueue: DiscoveryPlugin[] = []
    // Iterate through the first list
    for (const externalPackage of externalPackages) {
      const found = localPackages.find(localRecord => localRecord.uuid === externalPackage.uuid);
      if (!found || found.version !== externalPackage.version) {
        discoveryPluginQueue.push(DiscoveryPlugin.from(externalPackage));
      }
    }
    await debug(`${discoveryPluginQueue.length} discovery plugins need to be updated or installed`);
    await Package.bulkUpsert(discoveryPluginQueue);

  } catch (e) {
    await debug('Could not install discovery plugins')
  }
}

export default Package;
