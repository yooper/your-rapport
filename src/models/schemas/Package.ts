// Package.ts
import { db } from '../db/dexieDb';
import { debug } from '../../services/logger_services';
import { DiscoveryPlugin } from './DiscoveryPlugin';

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
  }

  /**
   * Install the package by fetching its JSON and adding it to the discoveryPlugin table.
   */
  static async install(record: Package): Promise<void> {
    const res = await fetch(record.url, { method: 'GET' });
    if (!res.ok) {
      debug(`Failed to fetch package from ${record.url}: ${res.status} ${res.statusText}`)
      return;
    }
    const data: DiscoveryPlugin = await res.json();
    await db.discoveryPlugin.put(data);
  }
}

export default Package;
