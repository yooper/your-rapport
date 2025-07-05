/**
 * TODO wrap with async since it needs a configuration setting
 * @param message
 * @param data
 */
import { Configuration } from '../models/schemas/Configuration';

export function debug(message, data = {}){
  Configuration.getConfigurationValue('debug', true).then(value => {
    if(value) {
      console.log(message, data)
    }
  })
}