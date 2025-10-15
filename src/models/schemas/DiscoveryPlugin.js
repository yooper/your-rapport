export class DiscoveryPlugin {
  constructor() {
    this.uuid = crypto.randomUUID();
    this.pluginType = null;
    this.url = null;
    this.active = true;
    this.groupName = 'Default';
    this.action = null;
    this.homePage = null;
    this.description = null;
    this.label = null;
    this.readOnly = false;
    this.sortOrder = 0;
    this.timeOut = 100;
    this.lastAccessedOn = null;
    this.createdOn = new Date();
    this.timeTakenIn = 0;
    this.method = 'GET';
    this.accessed = 0;
    this.version = '0.0.1';
    this.mimeTypeRegex = null;
    this.status = null;
    this.statusError = null;
    this.contentTypeHeader = null;
    this.fieldMapping = {};
    this.headers = {};
    this.selectorValue = null; // this is assigned by the user
  }

  /**
   * The available actions for the discovery plugin
   * @returns {string[]}
   */
  getActions() {
    return ['BackgroundRunner', 'CreateTab', 'SingleTask', 'SubmitForm'];
  }
}
