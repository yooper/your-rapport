export class NoChangeDetectedError extends Error {
  constructor(message = 'No Change Detected') {
    super(message);
    this.message = message;
  }
}