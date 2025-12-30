import { CONFIGURATION } from '../../services/constants';
import { getUtcNow } from '../../utilities/transformers';
import { debug } from '../../services/logger_services';

// Shape of the configuration store
export interface IConfiguration {
  authToken: string | false;
  productVersion: 'trial' | 'pro' | string;
  automationUnitDefault: string; // e.g. "count", "time", etc.
  automationValueDefault: number;
  automationDelayTabOpenDefault: number;
  automationKeepTabOpenDefault: boolean;
  automationDeepSaveEnabled: boolean;
  debugMessagesEnabled: boolean;
  highlightSelectorsEnabled: boolean;
  packageCacheEnabled: boolean;
  packageCacheHash: string;
  screenShotCount: number;
  updatedOn: number;
  syncBackgroundMode: 'sync' | 'batch' | string,
  syncBackgroundEnabled: boolean,
  syncBackgroundHardDelete: boolean,
  syncBackgroundPath: 'your_rapport/sync/' | string,
  syncBackgroundArtifactResolution: 'highRes' | 'lowRes' | string
  // Allow future unknown keys without breaking
  [key: string]: unknown;
}

export class Configuration {
  // Internal helper to build defaults in one place
  private static getDefaultConfiguration(): IConfiguration {
    return {
      authToken: false,
      productVersion: 'trial',
      automationUnitDefault: 'count',
      automationValueDefault: 100,
      automationDelayTabOpenDefault: 3000,
      automationDeepSaveEnabled: false,
      automationKeepTabOpenDefault: true,
      debugMessagesEnabled: false,
      highlightSelectorsEnabled: false,
      packageCacheEnabled: false,
      packageCacheHash: 'not set',
      screenShotCount: 0,
      updatedOn: getUtcNow(),
      syncBackgroundMode: 'sync',
      syncBackgroundEnabled: false,
      syncBackgroundHardDelete: true,
      syncBackgroundPath: 'your_rapport/sync/',
      syncBackgroundArtifactResolution: 'highRes'
    };
  }

  static async getConfiguration(): Promise<IConfiguration> {
    const value = await chrome.storage.local.get(CONFIGURATION);
    try {
      if (!value || !value[CONFIGURATION] || Object.keys(value).length === 0) {
        await Configuration.setConfiguration(await Configuration.getDefaultConfiguration())
        return Configuration.getDefaultConfiguration();
      }
      const data = JSON.parse(value[CONFIGURATION]);
      return data;
    } catch (e) {
      debug('error in configuration settings;')
      return Configuration.getDefaultConfiguration();
    }
  }

static async setConfiguration(configuration: IConfiguration): Promise<IConfiguration> {
  const instance = { [CONFIGURATION]: JSON.stringify(configuration) };
  await chrome.storage.local.set(instance);
  return configuration;
}


  static async setConfigurationValue<T = unknown>(
    key: string,
    value: T
  ): Promise<IConfiguration> {
    const configuration = await Configuration.getConfiguration();
    configuration[key] = value;
    return await Configuration.setConfiguration(configuration);
  }

  static async getConfigurationValue<T = unknown>(
    key: string,
    defaultValue: T | null = null
  ): Promise<T | null> {
    const configuration = await Configuration.getConfiguration();
    return (key in configuration
      ? (configuration[key] as T)
      : defaultValue) as T | null;
  }
}
