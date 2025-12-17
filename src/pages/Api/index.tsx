import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import Editor from "@monaco-editor/react";

import { APIResponse, Props } from "../../types";
import { processApiRequest } from "../../services/api_services";
import { db } from "../../models/db/dexieDb";
import { Artifact } from "../../models/schemas/Artifact";

type ViewMode = "json" | "artifact";
type MonacoTheme = "vs-dark" | "vs-light";

function useLocalStorageState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore
    }
  }, [key, value]);

  return [value, setValue] as const;
}

function formatJsonSafely(value: unknown, pretty = 2): string {
  try {
    return JSON.stringify(value, null, pretty);
  } catch {
    return String(value);
  }
}

/**
 * Normalize unknown data shapes (Blob/ArrayBuffer/Uint8Array/string) to a Blob.
 */
function normalizeToBlob(data: unknown, mime?: string): Blob {
  const type = (mime || "").toLowerCase() || "application/octet-stream";
  if (data instanceof Blob) return data;
  if (data instanceof ArrayBuffer) return new Blob([data], { type });
  if (data instanceof Uint8Array) return new Blob([data], { type });
  if (typeof data === "string") {
    const t = type.startsWith("text/") ? type : "text/plain";
    return new Blob([data], { type: t });
  }
  return new Blob([String(data ?? "")], { type: "text/plain" });
}

function isJsonArtifact(mime: string, url?: string | null) {
  const m = (mime || "").toLowerCase();
  const u = (url || "").toLowerCase();
  return m === "application/json" || u.endsWith(".json");
}

function isTextArtifact(mime: string, url?: string | null) {
  const m = (mime || "").toLowerCase();
  const u = (url || "").toLowerCase();
  return m.startsWith("text/") || u.endsWith(".txt");
}

function isMhtmlArtifact(mime: string, url?: string | null) {
  const m = (mime || "").toLowerCase();
  const u = (url || "").toLowerCase();

  // extension-based
  if (u.endsWith(".mhtml") || u.endsWith(".mht")) return true;

  // common/observed mhtml-ish mimes
  if (m.includes("mhtml") || m.includes("mimearchive")) return true;
  if (m.startsWith("multipart/related")) return true;

  return false;
}

const MonacoViewer: React.FC<{
  value: string;
  language: "json" | "plaintext";
  height?: string | number;
  storageKeyPrefix?: string;
}> = ({ value, language, height = "80vh", storageKeyPrefix = "your-rapport-monaco" }) => {
  const [theme, setTheme] = useLocalStorageState<MonacoTheme>(
    `${storageKeyPrefix}:theme`,
    "vs-dark"
  );

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ opacity: 0.8 }}>Theme</span>
          <select value={theme} onChange={(e) => setTheme(e.target.value as MonacoTheme)}>
            <option value="vs-dark">Dark</option>
            <option value="vs-light">Light</option>
          </select>
        </label>
      </div>

      <div style={{ width: "100%", height }}>
        <Editor
          value={value}
          language={language}
          theme={theme}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            wordWrap: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            fontSize: 13,
          }}
        />
      </div>
    </div>
  );
};

const ApiRequestViewer: React.FC<Props> = ({ autoRun = true, pretty = 2 }) => {
  const [result, setResult] = useState<APIResponse | Artifact | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    try {
      const res = await processApiRequest();
      setResult(res as APIResponse);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  useEffect(() => {
    if (autoRun) void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun]);

  const payload = error
    ? { success: false, error }
    : result ?? { success: false, error: "No result yet." };

  return (
    <MonacoViewer
      value={formatJsonSafely(payload, pretty)}
      language="json"
      storageKeyPrefix="your-rapport-api"
    />
  );
};

const ArtifactLoader: React.FC<{ uuid: string }> = ({ uuid }) => {
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {

    async function fetchData()
    {
      setArtifact(await db.artifact.get(uuid) ?? null)
    }
    fetchData();
  }, []);

  if(isLoading){
    return <div></div>
  }

  return <ArtifactViewer artifact={artifact} />;
};


const App: React.FC = () => {
  const params = new URLSearchParams(window.location.search);
  const format = (params.get("format") ?? "json").toLowerCase();
  const uuid = params.get("uuid") ?? "";
  const [isLoading, setIsLoading] = useState<boolean>();
  const [artifact, setArtifact] = useState<Artifact|null>();
  const [text, setText] = useState<string|null>()
  useEffect(() => {

    async function fetchData(){
      setIsLoading(true);
      setArtifact(await db.artifact.get(uuid));
      setText(await artifact?.data.text())
      setIsLoading(false);
    }

    fetchData();

  }, [])

  if(isLoading){
    return <div></div>
  }
  else if(!isLoading && !artifact && !text){
    return <div>Artifact cannot be rendered.</div>
  }

  return (
    <pre>
      { }
    </pre>

  )

};

const container = document.getElementById("app-container");
if (!container) throw new Error('Missing root element with id="app-container".');

createRoot(container).render(<App />);
