import { addRecord } from '../db/local';
import { DISCOVERY_PLUGIN, UUID } from '../../services/constants';

class Package {
  constructor(data) {
    this.name = data.name;
    this.uuid = data.uuid;
    this.label = data.label;
    this.version = data.version;
    this.description = data.description;
    this.updatedOn = data.updatedOn;
    this.sha256 = data.sha256;
    this.url = data.url;
    this.type = data.type;
    this.country = data.country;
  }

  /**
   * Install the package
   * @param {Package}record
   * @returns {Promise<void>}
   */
  static async install(record) {
    const response = await fetch(record.url);
    const data = await response.json();
    await addRecord(DISCOVERY_PLUGIN, UUID, data);
  }
}
