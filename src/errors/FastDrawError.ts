export class FastDrawError extends Error {
  constructor(message = 'Too many calls to the Chrome api functions.') {
    super(message);
    this.message = message;
  }
}