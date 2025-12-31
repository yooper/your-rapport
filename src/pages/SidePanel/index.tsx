import * as React from "react";
import { Fragment, useEffect, useRef, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, createTheme, Paper } from "@mui/material";
import { ReactNotifications } from "react-notifications-component";

import { getDarkTheme, hideLoader, showLoader } from "../../utilities/loaders";
import TopAppBar from "../../components/TopAppBar";
import SidePanelDataTable from "../../components/tables/SidePanelDataTable";
import { debug } from "../../services/logger_services";
import type { PageInfo } from "../../types";

import "./index.css";
import "react-notifications-component/dist/theme.css";

const App: React.FC = () => {
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTabUrl, setActiveTabUrl] = useState<string>("");

  // persistent cache across renders
  const cacheRef = useRef<Record<string, PageInfo>>({});

  const fetchDataForUrl = useCallback(async (url: string) => {
    if (!url) {
      setPageInfo(null);
      return;
    }

    showLoader();
    setIsLoading(true);

    try {
      if (cacheRef.current[url]) {
        await debug("cached response", cacheRef.current[url]);
      } else {
        const response = (await chrome.runtime.sendMessage({
          cmd: "slidePanelInit",
          requestId: crypto.randomUUID(),
          tabUrl: url, // optional, if your SW uses it
        })) as PageInfo;

        await debug("response received", response);
        cacheRef.current[url] = response;
      }

      setPageInfo(cacheRef.current[url] ?? null);
    } catch (e) {
      await debug("sidepanel fetchData error", e);
      setPageInfo(null);
    } finally {
      setIsLoading(false);
      hideLoader();
    }
  }, []);

  // Keep activeTabUrl updated from Chrome's active tab
  useEffect(() => {
    let alive = true;

    const updateFromActiveTabId = async (tabId: number) => {
      try {
        const tab = await chrome.tabs.get(tabId);
        const url = tab.url ?? "";
        if (!alive) return;
        setActiveTabUrl(url);
      } catch (e) {
        await debug("tabs.get failed", e);
      }
    };

    const init = async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!alive) return;
      setActiveTabUrl(tab?.url ?? "");
    };

    const onActivated = (activeInfo: chrome.tabs.TabActiveInfo) => {
      void updateFromActiveTabId(activeInfo.tabId);
    };

    const onUpdated = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
      // when the active tab navigates, tab.url changes
      if (tab.active && typeof changeInfo.url === "string") {
        setActiveTabUrl(changeInfo.url);
      }
    };

    void init();
    chrome.tabs.onActivated.addListener(onActivated);
    chrome.tabs.onUpdated.addListener(onUpdated);

    return () => {
      alive = false;
      chrome.tabs.onActivated.removeListener(onActivated);
      chrome.tabs.onUpdated.removeListener(onUpdated);
    };
  }, []);

  // Re-parse whenever activeTabUrl changes
  useEffect(() => {
    void fetchDataForUrl(activeTabUrl);
  }, [activeTabUrl, fetchDataForUrl]);

  if (isLoading) return <div />;

  return (
    <Fragment>
      <ReactNotifications />
      <SidePanelDataTable pageInfo={pageInfo} />
    </Fragment>
  );
};

const container = document.getElementById("app-container");
if (!container) throw new Error("Missing root element: #app-container");

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <ThemeProvider theme={createTheme(getDarkTheme())}>
      <TopAppBar />
      <Paper sx={{ width: "100%", height: "100%" }}>
        <App />
      </Paper>
    </ThemeProvider>
  </React.StrictMode>
);
