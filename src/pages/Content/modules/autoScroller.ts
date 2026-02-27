import { getVisibleText } from "./visibleElements";
import {
  ACTIVATE_AUTOMATION,
  ACTIVATE_CAPTURE,
  AUTO_COLLECT_MAX_SCREENSHOTS,
  AUTO_COLLECT_SCROLLBAR_STOPPED,
  BULK_AUTOMATION,
  CAPTURE_VISIBLE_TAB,
  NO_VISIBLE_TEXT,
} from "../../../services/constants";
import { getPageInfo } from "../index";
import { debug } from "../../../services/logger_services";

/** Local state machine */
const STATE_STOPPED = "stopped" as const;
const STATE_INITIALIZED = "initialized" as const;
const STATE_ACTIVE = "active" as const;

export type AutoScrollState = typeof STATE_STOPPED | typeof STATE_INITIALIZED | typeof STATE_ACTIVE;
export let state: AutoScrollState = STATE_INITIALIZED;
import html2canvas from 'html2canvas-pro';


type Direction = "down" | "up";

export type BulkAutomationRecord = {
  value: number;
  screenShotsCollected: number;
  completedOn?: number | null;
  description?: string | null;
  status?: "queued" | "running" | "done" | "failed";
  // allow extra fields without breaking
  [key: string]: unknown;
};

type AutoScrollerMessage = {
  cmd?: string;
  automation?: BulkAutomationRecord | null;
  delayMs?: number; // optional override
  [key: string]: unknown;
};

type AnyRecord = Record<string, unknown>;

const DEFAULT_DELAY_MS = 1050;
const MAX_RUNTIME_ERRORS_BEFORE_STOP = 3;

let capturedHeight = 0;
let screenCollectionCount = 0;
let automation: BulkAutomationRecord | null = null;

/** Used to detect non-scrolling issue */
let previousWindowScrollY = -1;

/** Prevents overlapping loops (each start/stop bumps this token) */
let runToken = 0;

/** Soft-fail counter for transient runtime errors */
let consecutiveRuntimeErrors = 0;

async function getViewport(): Promise<string> {
  const canvas = await html2canvas(document.body, {
    x: window.scrollX,
    y: window.scrollY,
    width: window.innerWidth,
    height: window.innerHeight,
    scale: 1
  });
  return canvas.toDataURL("image/png");
}

function isObject(v: unknown): v is AnyRecord {
  return typeof v === "object" && v !== null;
}

function getScrollDetailsByHostName(): { scrollElement: HTMLElement; direction: Direction } {
  // If you later need per-host logic, keep returning an HTMLElement (scrollTop/scrollHeight/clientHeight).
  return { scrollElement: document.documentElement, direction: "down" };
}

function setAutomation(msg: AutoScrollerMessage): void {
  if (Object.prototype.hasOwnProperty.call(msg, "automation")) {
    automation = (msg.automation ?? null) as BulkAutomationRecord | null;
  }
}

async function safeSendMessage<T = unknown>(payload: AnyRecord): Promise<T | null> {
  try {
    const res = (await chrome.runtime.sendMessage(payload)) as T;
    consecutiveRuntimeErrors = 0;
    return res;
  } catch (e) {
    consecutiveRuntimeErrors++;
    await remoteDebug("chrome.runtime.sendMessage failed", {
      error: e instanceof Error ? e.message : String(e),
      consecutiveRuntimeErrors,
      payload,
    });
    return null;
  }
}

function hasCompleted(resp: unknown): boolean {
  return isObject(resp) && "completed" in resp;
}

function isScrollable(root: HTMLElement): boolean {
  // Some pages rely on body scrolling; documentElement usually works, but be safe.
  const docScrollable = document.documentElement.scrollHeight > document.documentElement.clientHeight;
  const rootScrollable = root.scrollHeight > root.clientHeight;
  return docScrollable || rootScrollable;
}

function atBottom(): boolean {
  // Be tolerant to rounding.
  const epsilon = 2;
  return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - epsilon;
}

function normalizeVisibleText(t: unknown): string {
  if (typeof t !== "string") return "";
  return t.trim();
}

/**
 * Scrolls up or down depending upon which host it is trying to scan.
 * @param message the message received from the background worker
 */
export function autoScroller(message: AutoScrollerMessage): void {
  // Each invocation cancels any previous loop.
  runToken++;
  const myToken = runToken;
  remoteDebug('autoScroller: message received', message)
  previousWindowScrollY = -1;
  consecutiveRuntimeErrors = 0;

  setAutomation(message);

  // Toggle behavior: if already active, stop. Otherwise start only on known commands.
  if (state === STATE_ACTIVE) {
    state = STATE_STOPPED;
  } else if ([ACTIVATE_AUTOMATION, ACTIVATE_CAPTURE].includes(String(message.cmd ?? ""))) {
    state = STATE_ACTIVE;
    // Reset counters on new run
    screenCollectionCount = 0;
    capturedHeight = window.scrollY || 0;
  } else {
    remoteDebug('autoScroller:hard stopped', message)
    state = STATE_STOPPED;
  }

  if (state === STATE_STOPPED) {
    remoteDebug('autoScroller:stopped', message);
    return;
  }

  const delayMs = Number.isFinite(message.delayMs) ? Math.max(0, Number(message.delayMs)) : DEFAULT_DELAY_MS;

  const loop = (): void => {
    // Cancelled or stopped?
    if (myToken !== runToken || state !== STATE_ACTIVE) {
      void remoteDebug("Autoscroller stopped/cancelled", { myToken, runToken, state });
      void remoteDebug("Automation stopped");
      return;
    }

    const { scrollElement: root, direction } = getScrollDetailsByHostName();
    const clientHeight = root.clientHeight || document.documentElement.clientHeight;
    const scrollHeight = root.scrollHeight || document.documentElement.scrollHeight;
    const scrollAmount = clientHeight;

    void (async () => {
      // Bail out on repeated runtime failures (e.g., MV3 service worker asleep/no listener).
      if (consecutiveRuntimeErrors >= MAX_RUNTIME_ERRORS_BEFORE_STOP) {
        state = STATE_STOPPED;
        await remoteDebug("Automation stopped due to repeated runtime errors");
        return;
      }

      // If page isn’t scrollable, finish quickly.
      if (!isScrollable(root) || scrollAmount <= 0) {
        state = STATE_STOPPED;
        await safeSendMessage({
          cmd: AUTO_COLLECT_SCROLLBAR_STOPPED,
          pageInfo: { ...(await getPageInfo()), automation, sequence: screenCollectionCount, screenshot: await getViewport() },
        });
        await remoteDebug("Automation finished, non-scrollable page");
        return;
      }

      const visibleText = normalizeVisibleText(getVisibleText());
      if (!visibleText) {
        state = STATE_STOPPED;
        await remoteDebug("Text could not be read in.");

        await safeSendMessage({
          cmd: NO_VISIBLE_TEXT,
          pageInfo: { ...(await getPageInfo()), automation, sequence: screenCollectionCount++, screenshot: await getViewport() },
        });

        return;
      }

      // Capture
      const captureResp = await safeSendMessage({
        cmd: CAPTURE_VISIBLE_TAB,
        pageInfo: { ...(await getPageInfo()), automation, sequence: screenCollectionCount++, screenshot: await getViewport() },
      });

      if (!hasCompleted(captureResp)) {
        state = STATE_STOPPED;
        await remoteDebug("Failed to save");
        await remoteDebug("Could not save rapport, stopping loop", { pageInfo: await getPageInfo(), captureResp });
        return;
      }

      // Update automation progress
      if (automation) {
        //await safeUpdateAutomation({ screenShotsCollected: screenCollectionCount });
      }

      // Stop if we can’t scroll further
      if (atBottom()) {
        state = STATE_STOPPED;
        await safeSendMessage({
          cmd: AUTO_COLLECT_SCROLLBAR_STOPPED,
          pageInfo: { ...(await getPageInfo()), automation, sequence: screenCollectionCount, screenshot: await getViewport() },
        });
        await remoteDebug("Automation finished, reached bottom of page");
        return;
      }

      // Detect stuck scroll position
      if (previousWindowScrollY !== window.scrollY) {
        previousWindowScrollY = window.scrollY;
      } else {
        await remoteDebug("Window not scrolling");
        state = STATE_STOPPED;

        await safeSendMessage({
          cmd: AUTO_COLLECT_SCROLLBAR_STOPPED,
          pageInfo: { ...(await getPageInfo()), automation, sequence: screenCollectionCount, screenshot: await getViewport() },
        });

        await remoteDebug("Automation finished, window not scrolling");
        return;
      }

      // Scroll step
      if (direction === "down") {
        capturedHeight += scrollAmount;
        if (capturedHeight < scrollHeight) {
          root.scrollTo({ top: capturedHeight, left: 0, behavior: "instant" as ScrollBehavior });
        }
      } else {
        capturedHeight = Math.max(0, capturedHeight - scrollAmount);
        root.scrollTop = capturedHeight;
      }

      // Stop if max screenshots reached
      if (automation && screenCollectionCount >= Number(automation.value ?? 0)) {
        await safeSendMessage({
          cmd: AUTO_COLLECT_MAX_SCREENSHOTS,
          pageInfo: { ...(await getPageInfo()), automation, sequence: screenCollectionCount, screenshot: await getViewport() },
        });
        remoteDebug("Max screenshots collected");
        state = STATE_STOPPED;
        return;
      }

      // Continue loop
      if (myToken === runToken && state === STATE_ACTIVE) {
        setTimeout(loop, delayMs);
      }
    })();
  };

  loop();
}

export async function remoteDebug(
  message: string,
  data: any = {},
): Promise<void> {
  message = 'contentScript:debug ' + message;

  // dump the error in the content script window
  await debug(message, data)
  // forward the debug information for improved error tracking
  await safeSendMessage({
    cmd: 'remoteDebug',
    message: message,
    data: { ...(await getPageInfo()), sequence: screenCollectionCount, ...data }
  });
}
