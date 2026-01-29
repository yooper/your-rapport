import { Configuration } from '../models/schemas/Configuration';

/**
 * Logs a message and optional data object if debug mode is enabled.
 * TODO: persist logs
 * @param message - Message to log (string or any value)
 * @param data - Optional additional data object to log
 * @param includeTrace : boolean
 */
export async function debug(
  message: string,
  data: any = {},
  includeTrace = true
): Promise<void> {
  try {

    const tsMessage = `[${new Date().toISOString()}] `+message
    const value: boolean = await Configuration.getConfigurationValue<boolean>(
      'debugMessagesEnabled',
      true
    ) ?? false;
    if (value && includeTrace) {
      console.trace(tsMessage, data);
    } else if (value) {
      console.log(tsMessage, data);
    }
    else{
      // debug is off
    }
  } catch (err) {
    console.error('Failed to retrieve debug configuration:', err);
  }
}
