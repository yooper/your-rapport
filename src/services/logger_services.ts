import { Configuration } from '../models/schemas/Configuration';

/**
 * Logs a message and optional data object if debug mode is enabled.
 *
 * @param message - Message to log (string or any value)
 * @param data - Optional additional data object to log
 * @param includeTrace : boolean
 */
export async function debug(
  message: string,
  data: any = {},
  includeTrace = false
): Promise<void> {
  try {
    const value: boolean = await Configuration.getConfigurationValue<boolean>(
      'debugMessagesEnabled',
      true
    );
    if (value && includeTrace) {
      console.trace(message, data);
    } else if (value) {
      console.log(message, data);
    }
  } catch (err) {
    console.error('Failed to retrieve debug configuration:', err);
  }
}
