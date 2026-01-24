export class DuplicateDetectedError extends Error {
  constructor(message = 'The last record has the same hash, as the current record.') {
    super(message);
    this.message = message;
  }
}