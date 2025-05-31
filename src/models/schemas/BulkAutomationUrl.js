/**
 * Used for tracking the bulk collection objects
 */
export class BulkAutomationUrl {
  constructor(
    uuid,
    url,
    unit,
    value,
    screenShotsCollected = 0,
    createdOn = Date.now(),
    keepTabOpen = true,
    ranOn = null,
    completedOn = null,
    description = null
  ) {
    this.uuid = uuid;
    this.url = url;
    this.unit = unit;
    this.value = value;
    this.screenShotsCollected = screenShotsCollected;
    this.keepTabOpen = keepTabOpen
    this.createdOn = createdOn;
    this.ranOn = ranOn;
    this.completedOn = completedOn;
    this.description = description;
  }
  markRan() {
    this.ranOn = Date.now();
  }
  markCompleted() {
    this.completedOn = Date.now();
  }
  markError(message) {
    this.error = message;
  }
}
