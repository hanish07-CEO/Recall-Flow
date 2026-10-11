/** Error carrying an HTTP status so route handlers can respond precisely. */
export class HttpError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
    this.name = 'HttpError';
  }
}
