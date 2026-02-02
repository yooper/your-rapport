import { getVisibleText } from "./visibleElements";
import {
  ACTIVATE_AUTOMATION,
  ACTIVATE_CAPTURE,
  AUTO_COLLECT_MAX_SCREENSHOTS,
  AUTO_COLLECT_SCROLLBAR_STOPPED,
  CAPTURE_VISIBLE_TAB,
  NO_VISIBLE_TEXT,
} from "../../../services/constants";
import { getPageInfo } from "../index";
import { debug } from "../../../services/logger_services";

/** Local state machine */
const STATE_STOPPED = "stopped" as const;
const STATE_INITIALIZED = "initialized" as const;
const STATE_ACTIVE = "active" as const;

type AutoScrollState = typeof STATE_STOPPED | typeof STATE_INITIALIZED | typeof STATE_ACTIVE;
type Direction = "down" | "up";

export type BulkAutomationRecord = {
  value: number;
  screenShotsCollected: number;
  completedOn?: number | null;
  description?: string | null;
  status?: "queued" | "running" | "done" | "failed";
  [key: string]: unknown;
};

export type AutoScrollerMessage = {
  cmd?: string;
  automation?: BulkAutomationRecord | null;
  delayMs?: number;
  [key: string]: unknown;
};

type AnyRecord = Record<string, unknown>;

const DEFAULT_DELAY_MS = 1050;
const MAX_RUNTIME_ERRORS_BEFORE_STOP = 3;

function isObject(v: unknown): v is AnyRecord {
  return typeof v === "object" && v !== null;
}

function hasCompleted(resp: unknown): boolean {
  return isObject(resp) && "completed" in resp;
}

function getScrollDetailsByHostName(): { scrollElement: HTMLElement; direction: Direction } {
  return { scrollElement: document.documentElement, direction: "down" };
}

function isScrollable(root: HTMLElement): boolean {
  const docScrollable = document.documentElement.scrollHeight > document.documentElement.clientHeight;
  const rootScrollable = root.scrollHeight > root.clientHeight;
  return docScrollable || rootScrollable;
}

function atBottom(): boolean {
  const epsilon = 2;
  return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - epsilon;
}

function normalizeVisibleText(t: unknown): string {
  if (typeof t !== "string") return "";
  return t.trim();
}

async function safeSendMessage<T = unknown>(payload: AnyRecord): Promise<T | null> {
  try {
    const res = (await chrome.runtime.sendMessage(payload)) as T;
    return res;
  } catch (e) {
    await debug("chrome.runtime.sendMessage failed", {
      error: e instanceof Error ? e.message : String(e),
      payload,
    });
    return null;
  }
}

type Controller = {
  state: AutoScrollState;
  start: (msg: AutoScrollerMessage) => void;
  stop: (reason?: string) => void;
};

/**
 * Install singleton controller on globalThis so the service worker can start/stop via chrome.scripting.executeScript
 */
declare global {
  // eslint-disable-next-line no-var
  var __YR_autoscroller: Controller | undefined;
}

(() => {
  // If reinjected, keep the existing controller (and don’t create duplicates)
  if (globalThis.__YR_autoscroller) return;

  let state: AutoScrollState = STATE_INITIALIZED;

  let capturedHeight = 0;
  let screenCollectionCount = 0;
  let automation: BulkAutomationRecord | null = null;

  let previousWindowScrollY = -1;
  let runToken = 0;
  let consecutiveRuntimeErrors = 0;

  function setAutomation(msg: AutoScrollerMessage): void {
    if (Object.prototype.hasOwnProperty.call(msg, "automation")) {
      automation = (msg.automation ?? null) as BulkAutomationRecord | null;
    }
  }

  async function processAutomation(description: string | null = null): Promise<void> {
    if (!automation) {
      state = STATE_STOPPED;
      return;
    }
    // If you later want to persist automation progress, do it here.
    state = STATE_STOPPED;
    await debug("processAutomation", { description, screenCollectionCount });
  }

  function autoScroller(message: AutoScrollerMessage): void {
    runToken++;
    const myToken = runToken;

    previousWindowScrollY = -1;
    consecutiveRuntimeErrors = 0;

    setAutomation(message);

    if (state === STATE_ACTIVE) {
      state = STATE_STOPPED;
    } else if ([ACTIVATE_AUTOMATION, ACTIVATE_CAPTURE].includes(String(message.cmd ?? ""))) {
      state = STATE_ACTIVE;
      screenCollectionCount = 0;
      capturedHeight = window.scrollY || 0;
    } else {
      state = STATE_STOPPED;
    }

    if (state === STATE_STOPPED) {
      void debug("Autoscroller stopped", message);
      void processAutomation("Automation stopped");
      return;
    }

    const delayMs = Number.isFinite(message.delayMs)
      ? Math.max(0, Number(message.delayMs))
      : DEFAULT_DELAY_MS;

    const loop = (): void => {
      if (myToken !== runToken || state !== STATE_ACTIVE) {
        void debug("Autoscroller stopped/cancelled", { myToken, runToken, state });
        void processAutomation("Automation stopped");
        return;
      }

      const { scrollElement: root, direction } = getScrollDetailsByHostName();
      const clientHeight = root.clientHeight || document.documentElement.clientHeight;
      const scrollHeight = root.scrollHeight || document.documentElement.scrollHeight;
      const scrollAmount = clientHeight;

      void (async () => {
        if (consecutiveRuntimeErrors >= MAX_RUNTIME_ERRORS_BEFORE_STOP) {
          state = STATE_STOPPED;
          await processAutomation("Stopped due to repeated runtime errors");
          return;
        }

        if (!isScrollable(root) || scrollAmount <= 0) {
          state = STATE_STOPPED;
          await safeSendMessage({
            cmd: AUTO_COLLECT_SCROLLBAR_STOPPED,
            pageInfo: { ...(await getPageInfo()), automation, sequence: screenCollectionCount },
          });
          await processAutomation("Finished, non-scrollable page");
          return;
        }

        const visibleText = normalizeVisibleText(getVisibleText());
        if (!visibleText) {
          state = STATE_STOPPED;
          await debug("could not capture text");
          await processAutomation("Text could not be read in.");

          await safeSendMessage({
            cmd: NO_VISIBLE_TEXT,
            pageInfo: { ...(await getPageInfo()), automation, sequence: screenCollectionCount++ },
          });

          return;
        }

        const captureResp = await safeSendMessage({
          cmd: CAPTURE_VISIBLE_TAB,
          pageInfo: { ...(await getPageInfo()), automation, sequence: screenCollectionCount++ },
        });

        if (!hasCompleted(captureResp)) {
          state = STATE_STOPPED;
          await processAutomation("Failed to save");
          await debug("Could not save rapport, stopping loop", {
            pageInfo: await getPageInfo(),
            captureResp,
          });
          return;
        }

        if (atBottom()) {
          state = STATE_STOPPED;
          await safeSendMessage({
            cmd: AUTO_COLLECT_SCROLLBAR_STOPPED,
            pageInfo: { ...(await getPageInfo()), automation, sequence: screenCollectionCount },
          });
          await processAutomation("Finished, reached bottom of page");
          return;
        }

        if (previousWindowScrollY !== window.scrollY) {
          previousWindowScrollY = window.scrollY;
        } else {
          await debug("Window not scrolling");
          state = STATE_STOPPED;

          await safeSendMessage({
            cmd: AUTO_COLLECT_SCROLLBAR_STOPPED,
            pageInfo: { ...(await getPageInfo()), automation, sequence: screenCollectionCount },
          });

          await processAutomation("Finished, window not scrolling");
          return;
        }

        if (direction === "down") {
          capturedHeight += scrollAmount;
          if (capturedHeight < scrollHeight) {
            root.scrollTo({ top: capturedHeight, left: 0, behavior: "instant" as ScrollBehavior });
          }
        } else {
          capturedHeight = Math.max(0, capturedHeight - scrollAmount);
          root.scrollTop = capturedHeight;
        }

        if (automation && screenCollectionCount >= Number(automation.value ?? 0)) {
          await safeSendMessage({
            cmd: AUTO_COLLECT_MAX_SCREENSHOTS,
            pageInfo: { ...(await getPageInfo()), automation, sequence: screenCollectionCount },
          });
          await processAutomation("Max screenshots collected");
          state = STATE_STOPPED;
          return;
        }

        if (myToken === runToken && state === STATE_ACTIVE) {
          setTimeout(loop, delayMs);
        }
      })();
    };

    loop();
  }

  globalThis.__YR_autoscroller = {
    get state() {
      return state;
    },
    start(msg: AutoScrollerMessage) {
      autoScroller(msg);
    },
    stop(reason?: string) {
      runToken++; // cancels loops
      state = STATE_STOPPED;
      void debug("Autoscroller stop()", { reason });
    },
  };
})();
