import { getLocalItem, setLocalItem } from '../db/local';

export class Configuration{

  static async getConfiguration(){
    const configurationRegistry = (await getLocalItem('configuration')) ?? {
      authToken: false,
      productVersion: 'trial',
      automationUnitDefault: 'count',
      automationValueDefault: 100,
      automationDelayOpenTabDefault: 3000
    };
    return configurationRegistry;
  }

  static async setConfiguration(configuration){
    await setLocalItem('configuration', configuration);
    return configuration;
  }

  static async setConfigurationValue(key, value){
    let configuration = await Configuration.getConfiguration();
    configuration[key] = value;
    return await Configuration.setConfiguration(configuration);
  }

  static async getConfigurationValue(key, defaultValue = null){
    const configuration = await Configuration.getConfiguration();
    return key in configuration ? configuration[key] : defaultValue;
  }

}