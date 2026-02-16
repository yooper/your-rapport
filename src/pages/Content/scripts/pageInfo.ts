import { PageInfo } from '../../../types';
import { debug } from '../../../services/logger_services';
import Tab = chrome.tabs.Tab;


export async function getActivePageInfo(activeTab: Tab){
  try{
    const injectedResults = await chrome.scripting.executeScript({
        target : {tabId : activeTab.id, allFrames : false},
        func : getPageInfo,
      })

    // TODO: improve error handling
    if(injectedResults?.length > 0){
      if(!injectedResults[0].result){
        // an error occurred
      }
      return injectedResults[0].result
    }

  }
  catch(error){
    await debug('getActivePageInfo:error', {activeTab, error})
    return {}
  }
}

/**
 * Get Page Info
 */
export function getPageInfo(): PageInfo {

  /**
   * Extracts de-duplicated visible text tokens from elements currently in the viewport.
   * - Skips non-text-ish tags (script/style/img/etc)
   * - Skips non-standard/custom tags (helps reduce SPA noise)
   * - Skips elements that are not actually visible (CSS/opacity/visibility/content-visibility)
   * - Only considers elements fully inside the viewport (same as your original logic)
   *
   * @returns Tokens joined with " | "
   */
  function _getVisibleText(): string {
    // Tags that rarely/never produce meaningful "visible text" for this purpose
    const nonTextHtmlTags: Record<string, false> = {
      AREA: false,
      BASE: false,
      BR: false,
      COL: false,
      COLGROUP: false,
      EMBED: false,
      HEAD: false,
      HR: false,
      HTML: false,
      IMG: false,
      INPUT: false,
      LINK: false,
      META: false,
      PARAM: false,
      SCRIPT: false,
      STYLE: false,
      SOURCE: false,
      TRACK: false,
      WBR: false,
    };

    // Used to reduce noise from custom elements in SPAs (e.g. <my-widget>)
    const standardTags = new Set<string>([
      "a","abbr","address","area","article","aside","audio","b","base","bdi","bdo","blockquote","body","br","button",
      "canvas","caption","cite","code","col","colgroup","data","datalist","dd","del","details","dfn","dialog","div",
      "dl","dt","em","embed","fieldset","figcaption","figure","footer","form","h1","h2","h3","h4","h5","h6","head",
      "header","hr","html","i","iframe","img","input","ins","kbd","label","legend","li","link","main","map","mark",
      "meta","meter","nav","noscript","object","ol","optgroup","option","output","p","param","picture","pre","progress",
      "q","rp","rt","ruby","s","samp","script","section","select","small","source","span","strong","style","sub",
      "summary","sup","table","tbody","td","template","textarea","tfoot","th","thead","time","title","tr","track","u",
      "ul","var","video","wbr",
    ]);

    const seenText = new Set<string>();

    const isElementInViewport = (el: Element): boolean => {
      const rect = el.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    };

    const isNonStandardTag = (el: Element): boolean => {
      return !standardTags.has(el.tagName.toLowerCase());
    };

    const isElementVisible = (el: Element): boolean => {
      // checkVisibility is supported in modern Chromium; fall back safely if not present.
      const anyEl = el as any;
      if (typeof anyEl.checkVisibility === "function") {
        return anyEl.checkVisibility({
          opacityProperty: true,
          visibilityProperty: true,
          contentVisibilityAuto: true,
        });
      }

      // Fallback: basic computed-style visibility checks
      if (!(el instanceof HTMLElement)) return true;
      const style = window.getComputedStyle(el);
      if (style.display === "none") return false;
      if (style.visibility === "hidden") return false;
      if (style.opacity === "0") return false;
      return true;
    };

    const visibleElements = Array.from(document.querySelectorAll<HTMLElement>("*")).filter(
      (el) => isElementInViewport(el)
    );

    for (let idx = 0; idx < visibleElements.length; idx++) {
      const element = visibleElements[idx];
      const tag = element.tagName.toUpperCase();

      if (nonTextHtmlTags[tag] === false || isNonStandardTag(element) || !isElementVisible(element)) {
        continue;
      }

      const text = element.innerText?.trim();
      if (!text) continue;

      const modifiedText = text.replace(/\s+/g, " ").trim().toLowerCase();
      const tokens = modifiedText.split(" ");

      for (const token of tokens) {
        const t = token.trim();
        if (t.length > 0 && !seenText.has(t)) {
          seenText.add(t);
        }
      }
    }
    return Array.from(seenText).join(" | ");
  }


  return {
    uuid: crypto.randomUUID(),
    title: document.title,
    contentType: document.contentType,
    html: document.documentElement.innerHTML,
    url: document.URL,
    screenShotCount: 0,
    visibleHtml: '',
    visibleText: _getVisibleText(),
    text: document.documentElement.innerText ?? document.documentElement.textContent,
    createdOn: Date.now(),
    tab: null,
    automation: null,
    sequence: 0
  };
}