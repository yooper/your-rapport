import { getLocalItem, setLocalItem } from '../db/local';
import { CONFIGURATION } from '../../services/constants';

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
      highlightSelectorsEnabled: false
    };
  }

  static async getConfiguration(): Promise<IConfiguration> {
    const value = await chrome.storage.local.get(CONFIGURATION);
    try {
      if (!value || Object.keys(value).length === 0) {
        await Configuration.setConfiguration(await Configuration.getDefaultConfiguration())
        return Configuration.getDefaultConfiguration()
      }
      const data = JSON.parse(value[CONFIGURATION]);
      return data;
    } catch (e) {
      console.error(e)
    }
    return Configuration.getDefaultConfiguration();
  }

  static async setConfiguration(
    configuration: IConfiguration
  ): Promise<IConfiguration> {
    const instance = { CONFIGURATION: JSON.stringify(configuration) };
    await chrome.storage.local.set(instance);
    await setLocalItem(CONFIGURATION, configuration);
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
