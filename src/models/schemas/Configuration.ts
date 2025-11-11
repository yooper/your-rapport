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
  automationBulkCollectionModel: boolean;
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
      automationKeepTabOpenDefault: true,
      automationBulkCollectionModel: false,
      debugMessagesEnabled: true
    };
  }

  static async getConfiguration(): Promise<IConfiguration> {
    const configuration =
      ((await getLocalItem(CONFIGURATION)) as IConfiguration | null) ??
      Configuration.getDefaultConfiguration();

    return configuration;
  }

  static async setConfiguration(
    configuration: IConfiguration
  ): Promise<IConfiguration> {
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
