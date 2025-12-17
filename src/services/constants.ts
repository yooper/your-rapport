/**
 * Common strings used throughout the software
 */

// storage keys
export const CONFIGURATION = 'configuration' as const;
export const RAPPORT = 'rapport' as const;
export const BULK_AUTOMATION = 'bulk_automation' as const;
export const SELECTOR = 'selector' as const;
export const DISCOVERY_PLUGIN = 'discovery_plugin' as const;
export const USER = 'user' as const;

export type StorageKey =
  | typeof CONFIGURATION
  | typeof RAPPORT
  | typeof BULK_AUTOMATION
  | typeof SELECTOR
  | typeof DISCOVERY_PLUGIN
  | typeof USER;

/**
 * Common field names used in objects
 */
export const UPDATED_ON = 'updatedOn' as const;
export const UUID = 'uuid' as const;

/**
 * State mapping
 */
export const INITIALIZED = 'initialized' as const;
export const STOPPED = 'stopped' as const;

/**
 * Commands
 */
export const ACTIVATE_CAPTURE = 'activateCapture' as const;
export const ACTIVATE_AUTOMATION = 'activateAutomation' as const;
export const AUTO_COLLECT_RUNNING = 'autoCollectRunning' as const;
export const AUTO_COLLECT_STARTING = 'autoCollectStarting' as const;
export const AUTOMATION_RUNNING = 'automationRunning' as const;
export const CAPTURE_VISIBLE_TAB = 'captureVisibleTab' as const;
export const ENQUEUE_BULK_AUTOMATION_URL = 'enqueueBulkAutomationUrl' as const;
export const STOP_SCRIPT = 'stopScript' as const;

export const PAGE_INITIALIZED = 'pageInitialized' as const;
export const PAGE_INFO = 'pageInfo' as const;
export const START_CAPTURE = 'startCapture' as const;
export const NO_VISIBLE_TEXT = 'noVisibleText' as const;
export const PROCESS_QUEUE_AUTOMATION_URLS = 'processQueueAutomationUrls' as const;
export const AUTO_COLLECT_SCROLLBAR_STOPPED = 'autoCollectScrollbarStopped' as const;
export const AUTO_COLLECT_MAX_SCREENSHOTS = 'autoCollectMaxScreenshots' as const;




export type CommandName =
  | typeof ACTIVATE_CAPTURE
  | typeof ACTIVATE_AUTOMATION
  | typeof AUTO_COLLECT_RUNNING
  | typeof AUTO_COLLECT_STARTING
  | typeof AUTOMATION_RUNNING
  | typeof CAPTURE_VISIBLE_TAB
  | typeof ENQUEUE_BULK_AUTOMATION_URL
  | typeof STOP_SCRIPT
  | typeof PAGE_INITIALIZED
  | typeof START_CAPTURE
  | typeof PROCESS_QUEUE_AUTOMATION_URLS
  | typeof AUTO_COLLECT_SCROLLBAR_STOPPED
  | typeof NO_VISIBLE_TEXT

