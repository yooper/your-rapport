export class DeepSaveError extends Error {
  constructor(message = 'An error occurred while trying to collect a deep save') {
    super(message);
    this.message = message;
  }
}