// Adds a small "+" button next to links that queues the URL into Your Rapport automation.
// Toggleable via Configuration.linkPlusEnabled stored in chrome.storage.local.

type AddAutomationUrlMsg = {
  action: "addAutomationUrl";
  url: string;
  title?: string;
};

type AddAutomationUrlResp =
  | { ok: true; existed: boolean; uuid?: string }
  | { ok: false; error: string };

const CONFIG_STORAGE_KEYS = ["configuration", "CONFIGURATION"]; // try both (common patterns)
const CFG_FLAG = "linkPlusEnabled";

const STYLE_ID = "yr-link-plus-style";
const WRAP_CLASS = "yr-link-plus-wrap";
const BTN_CLASS = "yr-link-plus-btn";

let enabled = false;
let observer: MutationObserver | null = null;
let clickAttached = false;

function isHttpLike(url: URL): boolean {
  return url.protocol === "http:" || url.protocol === "https:";
}

function tryGetAbsoluteHref(a: HTMLAnchorElement): string | null {
  const raw = a.getAttribute("href") ?? "";
  if (!raw) return null;

  // ignore anchors, js pseudo-links, and common non-web schemes
  const lowered = raw.trim().toLowerCase();
  if (lowered.startsWith("#")) return null;
  if (lowered.startsWith("javascript:")) return null;
  if (lowered.startsWith("mailto:")) return null;
  if (lowered.startsWith("tel:")) return null;

  try {
    const u = new URL(raw, document.baseURI);
    return isHttpLike(u) ? u.toString() : null;
  } catch {
    return null;
  }
}

function injectStylesOnce(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .${WRAP_CLASS}{
      display:inline-flex;
      align-items:center;
      gap:6px;
      vertical-align:baseline;
    }

    .${BTN_CLASS}{
      all:unset;
      cursor:pointer;
      user-select:none;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      width:18px;
      height:18px;
      border-radius:999px;
      border:1px solid rgba(120,120,120,.55);
      background: rgba(255,255,255,.88);
      backdrop-filter: blur(2px);
      font: 700 12px/1 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      box-shadow: 0 1px 2px rgba(0,0,0,.12);
    }

    .${BTN_CLASS}:hover{
      transform: translateY(-1px);
      box-shadow: 0 2px 6px rgba(0,0,0,.16);
    }

    .${BTN_CLASS}[data-yr-state="busy"],
    .${BTN_CLASS}[data-yr-state="done"]{
      cursor:default;
      transform:none;
      box-shadow:none;
      opacity:.7;
    }
  `;
  document.documentElement.appendChild(style);
}

function createBtn(): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = BTN_CLASS;
  btn.textContent = "+";
  btn.title = "Queue URL in Your Rapport automation";
  btn.setAttribute("aria-label", "Queue URL in Your Rapport automation");
  btn.dataset.yrState = "idle";
  return btn;
}

function alreadyDecorated(a: HTMLAnchorElement): boolean {
  return a.dataset.yrLinkPlusApplied === "1" || !!a.closest(`.${WRAP_CLASS}`);
}

function decorateAnchor(a: HTMLAnchorElement): void {
  if (alreadyDecorated(a)) return;
  if (a.isContentEditable) return;
  if (a.closest("[contenteditable='true']")) return;

  const abs = tryGetAbsoluteHref(a);
  if (!abs) return;

  const parent = a.parentNode;
  if (!parent) return;

  // Wrap with: <span class="wrap"><button>+</button><a .../></span>
  const wrap = document.createElement("span");
  wrap.className = WRAP_CLASS;
  (wrap.dataset as DOMStringMap).yrPlusWrap = "1";

  const btn = createBtn();

  parent.insertBefore(wrap, a);
  wrap.appendChild(btn);
  wrap.appendChild(a);

  a.dataset.yrLinkPlusApplied = "1";
}

function decorateLinks(root: ParentNode): void {
  const anchors = root.querySelectorAll<HTMLAnchorElement>("a[href]");
  anchors.forEach((a) => decorateAnchor(a));
}

async function readConfig(): Promise<Record<string, unknown>> {
  try {
    const res = await chrome.storage.local.get(CONFIG_STORAGE_KEYS);
    for (const k of CONFIG_STORAGE_KEYS) {
      const v = res?.[k];
      if (v && typeof v === "object") return v as Record<string, unknown>;
    }
  } catch {
    // ignore
  }
  return {};
}

async function readEnabledFlag(): Promise<boolean> {
  const cfg = await readConfig();
  const v = cfg[CFG_FLAG];
  // default ON unless explicitly false
  return v !== false;
}

function getConfigFromStorageChange(changes: Record<string, chrome.storage.StorageChange>) {
  for (const k of CONFIG_STORAGE_KEYS) {
    const c = changes[k];
    if (!c) continue;
    const next = c.newValue;
    if (next && typeof next === "object") return next as Record<string, unknown>;
    return {};
  }
  return null;
}

function cleanup(): void {
  // unwrap: move <a> out of wrapper, remove wrapper
  const wraps = document.querySelectorAll<HTMLElement>(`.${WRAP_CLASS}[data-yr-plus-wrap="1"]`);
  wraps.forEach((wrap) => {
    const a = wrap.querySelector("a[href]") as HTMLAnchorElement | null;
    const parent = wrap.parentNode;
    if (!parent) {
      wrap.remove();
      return;
    }

    if (a) {
      parent.insertBefore(a, wrap);
      delete a.dataset.yrLinkPlusApplied;
    }
    wrap.remove();
  });

  document.getElementById(STYLE_ID)?.remove();
}

async function sendAddAutomationUrl(url: string, title?: string): Promise<AddAutomationUrlResp> {
  const msg: AddAutomationUrlMsg = { action: "addAutomationUrl", url, title };

  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(msg, (resp: AddAutomationUrlResp) => {
        const err = chrome.runtime.lastError?.message;
        if (err) return resolve({ ok: false, error: err });
        resolve(resp ?? { ok: false, error: "No response" });
      });
    } catch (e) {
      resolve({ ok: false, error: e instanceof Error ? e.message : "sendMessage failed" });
    }
  });
}

function onDocumentClick(e: MouseEvent): void {
  if (!enabled) return;

  const target = e.target as HTMLElement | null;
  const btn = target?.closest?.(`.${BTN_CLASS}`) as HTMLButtonElement | null;
  if (!btn) return;

  // Prevent navigation + page click handlers
  e.preventDefault();
  e.stopPropagation();

  if (btn.dataset.yrState === "busy" || btn.dataset.yrState === "done") return;

  const wrap = btn.closest(`.${WRAP_CLASS}`) as HTMLElement | null;
  const a = wrap?.querySelector("a[href]") as HTMLAnchorElement | null;
  const url = a ? tryGetAbsoluteHref(a) : null;
  if (!url) return;

  void (async () => {
    btn.dataset.yrState = "busy";
    const prevText = btn.textContent ?? "+";
    btn.textContent = "…";

    const resp = await sendAddAutomationUrl(url, a?.textContent?.trim() || undefined);

    if (resp.ok) {
      btn.dataset.yrState = "done";
      btn.textContent = "✓";
      btn.title = resp.existed ? "Already queued" : "Queued!";
    } else {
      btn.dataset.yrState = "idle";
      btn.textContent = prevText;
      btn.title = resp.error || "Failed to queue";
    }
  })();
}

function startObserver(): void {
  if (observer) return;
  observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of Array.from(m.addedNodes)) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        decorateLinks(node as ParentNode);
      }
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
}

function stopObserver(): void {
  observer?.disconnect();
  observer = null;
}

function attachClickOnce(): void {
  if (clickAttached) return;
  clickAttached = true;
  document.addEventListener("click", onDocumentClick, true);
}

function applyEnabled(next: boolean): void {
  if (next === enabled) return;
  enabled = next;

  if (enabled) {
    injectStylesOnce();
    attachClickOnce();
    decorateLinks(document);
    startObserver();
  } else {
    stopObserver();
    cleanup();
  }
}

function listenForConfigChanges(): void {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") return;
    const nextCfg = getConfigFromStorageChange(changes);
    if (nextCfg === null) return;

    const nextEnabled = nextCfg[CFG_FLAG] !== false;
    applyEnabled(nextEnabled);
  });
}

async function init(): Promise<void> {
  const initial = await readEnabledFlag();
  applyEnabled(initial);
  listenForConfigChanges();
}

void init();


export async function startLinkPlus(): Promise<void> {
  const initial = await readEnabledFlag();
  applyEnabled(initial);
  listenForConfigChanges();
}