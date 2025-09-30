import { Configuration } from '../models/schemas/Configuration';

/**
 * Logs a message and optional data object if debug mode is enabled.
 *
 * @param message - Message to log (string or any value)
 * @param data - Optional additional data object to log
 */
export async function debug(message: string, data: any = {}): Promise<void> {
  try {
    const value: boolean = await Configuration.getConfigurationValue<boolean>('debug', true);
    if (value) {
      console.log(message, data);
    }
  } catch (err) {
    console.error('Failed to retrieve debug configuration:', err);
  }
}
