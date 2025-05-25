/**
 * Used for tracking the bulk collection objects
 */
export class BulkAutomationUrl {
  constructor(
    uuid,
    url,
    unit,
    value,
    createdOn = Date.now(),
    ranOn = null,
    completedOn = null,
    error = null
  ) {
    this.uuid = uuid;
    this.url = url;
    this.unit = unit;
    this.value = value;
    this.createdOn = createdOn;
    this.ranOn = ranOn;
    this.completedOn = completedOn;
    this.error = error;
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
