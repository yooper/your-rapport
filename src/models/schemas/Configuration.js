import { getLocalItem, setLocalItem } from '../db/local';
import { CONFIGURATION } from '../../services/constants';

export class Configuration {
  static async getConfiguration() {
    const configuration = (await getLocalItem(CONFIGURATION)) ?? {
      authToken: false,
      productVersion: 'trial',
      automationUnitDefault: 'count',
      automationValueDefault: 100,
      automationDelayTabOpenDefault: 3000,
      automationKeepTabOpenDefault: true,
      automationBulkCollectionModel: false,
    };
    return configuration;
  }

  static async setConfiguration(configuration) {
    await setLocalItem(CONFIGURATION, configuration);
    return configuration;
  }

  static async setConfigurationValue(key, value) {
    let configuration = await Configuration.getConfiguration();
    configuration[key] = value;
    return await Configuration.setConfiguration(configuration);
  }

  static async getConfigurationValue(key, defaultValue = null) {
    const configuration = await Configuration.getConfiguration();
    return key in configuration ? configuration[key] : defaultValue;
  }
}
