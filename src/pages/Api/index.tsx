// src/index.tsx
import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import Editor from "@monaco-editor/react";

import { APIResponse, Props } from "../../types";
import { processApiRequest } from "../../services/api_services";
import { db } from "../../models/db/dexieDb";
import { Artifact } from "../../models/schemas/Artifact";

type ViewMode = "json" | "artifact";
type MonacoTheme = "vs-dark" | "vs-light" | "hc-black" | "hc-light";

const THEME_OPTIONS: Array<{ label: string; value: MonacoTheme }> = [
  { label: "Dark", value: "vs-dark" },
  { label: "Light", value: "vs-light" },
  { label: "High Contrast Dark", value: "hc-black" },
  { label: "High Contrast Light", value: "hc-light" },
];

const LANGUAGE_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "Auto", value: "auto" },
  { label: "Plain text", value: "plaintext" },
  { label: "JSON", value: "json" },
  { label: "HTML", value: "html" },
  { label: "CSS", value: "css" },
  { label: "JavaScript", value: "javascript" },
  { label: "TypeScript", value: "typescript" },
  { label: "Markdown", value: "markdown" },
  { label: "XML", value: "xml" },
];

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

function guessLanguage(mime: string, url?: string | null): string {
  const m = (mime || "").toLowerCase();
  const u = (url || "").toLowerCase();

  if (m === "application/json" || u.endsWith(".json")) return "json";
  if (m === "text/html" || u.endsWith(".html") || u.endsWith(".htm")) return "html";
  if (m === "text/css" || u.endsWith(".css")) return "css";
  if (m === "text/javascript" || m === "application/javascript" || u.endsWith(".js")) return "javascript";
  if (m === "text/typescript" || u.endsWith(".ts") || u.endsWith(".tsx")) return "typescript";
  if (m === "text/xml" || m === "application/xml" || u.endsWith(".xml")) return "xml";
  if (m === "text/markdown" || u.endsWith(".md")) return "markdown";
  return "plaintext";
}

function formatJsonSafely(value: unknown, pretty = 2): string {
  try {
    return JSON.stringify(value, null, pretty);
  } catch {
    return String(value);
  }
}

/**
 * Dexie/serialization can return data as Blob, ArrayBuffer, Uint8Array, or string.
 * Normalize to a Blob so URL.createObjectURL and .text() work reliably.
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

  // last resort (avoid crash)
  return new Blob([String(data ?? "")], { type: "text/plain" });
}

function isTextBased(mime: string, url?: string | null): boolean {
  const m = (mime || "").toLowerCase();
  const u = (url || "").toLowerCase();

  if (m.startsWith("text/")) return true;

  // common “texty” application mimes
  if (
    m === "application/json" ||
    m === "application/xml" ||
    m === "application/xhtml+xml" ||
    m === "application/javascript" ||
    m === "application/x-javascript" ||
    m === "application/typescript"
  ) {
    return true;
  }

  // extension fallback if mime is missing/wrong
  return (
    u.endsWith(".json") ||
    u.endsWith(".xml") ||
    u.endsWith(".html") ||
    u.endsWith(".htm") ||
    u.endsWith(".md") ||
    u.endsWith(".txt") ||
    u.endsWith(".css") ||
    u.endsWith(".js") ||
    u.endsWith(".ts") ||
    u.endsWith(".tsx")
  );
}

const MonacoViewer: React.FC<{
  value: string;
  defaultLanguage?: string;
  height?: string | number;
  className?: string;
  storageKeyPrefix?: string;
}> = ({
  value,
  defaultLanguage = "plaintext",
  height = "70vh",
  className,
  storageKeyPrefix = "your-rapport-monaco",
}) => {
  const [theme, setTheme] = useLocalStorageState<MonacoTheme>(
    `${storageKeyPrefix}:theme`,
    "vs-dark"
  );
  const [languageChoice, setLanguageChoice] = useLocalStorageState<string>(
    `${storageKeyPrefix}:language`,
    "auto"
  );

  const language = languageChoice === "auto" ? defaultLanguage : languageChoice;

  return (
    <div className={className} style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 8,
          flexWrap: "wrap",
        }}
      >
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ opacity: 0.8 }}>Language</span>
          <select
            value={languageChoice}
            onChange={(e) => setLanguageChoice(e.target.value)}
          >
            {LANGUAGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ opacity: 0.8 }}>Theme</span>
          <select value={theme} onChange={(e) => setTheme(e.target.value as MonacoTheme)}>
            {THEME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
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

const ApiRequestViewer: React.FC<Props> = ({ autoRun = true, pretty = 2, className }) => {
  const [result, setResult] = useState<APIResponse | Artifact | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    try {
      const res = await processApiRequest();
      setResult(res as APIResponse);
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    }
  };

  useEffect(() => {
    if (autoRun) void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun]);

  const payload = error
    ? { success: false, error }
    : result ?? { success: false, error: "No result yet." };

  const text = useMemo(() => formatJsonSafely(payload, pretty), [payload, pretty]);

  return (
    <MonacoViewer
      className={className}
      value={text}
      defaultLanguage="json"
      height="80vh"
      storageKeyPrefix="your-rapport-api"
    />
  );
};

const ArtifactLoader: React.FC<{ uuid: string }> = ({ uuid }) => {
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const a = (await db.artifact.get(uuid)) ?? null;
        if (!cancelled) setArtifact(a);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uuid]);

  if (error) return <div className="text-red-600">Failed to load artifact: {error}</div>;
  if (!artifact) return <div>Loading artifact…</div>;

  return <ArtifactViewer artifact={artifact} preferPdfEmbed />;
};

const ArtifactViewer: React.FC<{
  artifact: Artifact;
  preferPdfEmbed?: boolean;
}> = ({ artifact, preferPdfEmbed = true }) => {
  const mime = (artifact?.mimeType || "").toLowerCase();
  const blob = useMemo(() => normalizeToBlob(artifact.data, mime), [artifact.data, mime]);

  const textBased = useMemo(
    () => isTextBased(mime || blob.type, artifact.url),
    [mime, blob.type, artifact.url]
  );

  // Read text (for Monaco) if text-based
  const [text, setText] = useState<string | null>(null);
  const [textErr, setTextErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!textBased) {
      setText(null);
      setTextErr(null);
      return;
    }

    (async () => {
      try {
        const t = await blob.text();
        if (!cancelled) setText(t);
      } catch (e) {
        if (!cancelled) setTextErr(e instanceof Error ? e.message : String(e));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [blob, textBased]);

  // ✅ ALL TEXT-BASED artifacts (including HTML) render in Monaco
  if (textBased) {
    if (textErr) return <div className="text-red-600">Failed to read text: {textErr}</div>;
    if (text == null) return <div>Loading text…</div>;

    const lang = guessLanguage(mime || blob.type, artifact.url);

    const value =
      lang === "json"
        ? (() => {
            try {
              return JSON.stringify(JSON.parse(text), null, 2);
            } catch {
              return text;
            }
          })()
        : text;

    return (
      <MonacoViewer
        value={value}
        defaultLanguage={lang}
        height="80vh"
        storageKeyPrefix="your-rapport-artifact"
      />
    );
  }

  // Binary viewers below need an object URL
  const objectUrl = useMemo(() => URL.createObjectURL(blob), [blob]);
  useEffect(() => {
    return () => {
      try {
        URL.revokeObjectURL(objectUrl);
      } catch {
        // ignore
      }
    };
  }, [objectUrl]);

  const effectiveType = (mime || blob.type).toLowerCase();

  // Images
  if (effectiveType.startsWith("image/")) {
    return (
      <img
        src={objectUrl}
        alt={artifact.url ?? "image artifact"}
        style={{ maxWidth: "100%", height: "auto" }}
      />
    );
  }

  // Video
  if (effectiveType.startsWith("video/")) {
    return <video controls src={objectUrl} style={{ width: "100%" }} />;
  }

  // Audio
  if (effectiveType.startsWith("audio/")) {
    return <audio controls src={objectUrl} style={{ width: "100%" }} />;
  }

  // PDF
  if (effectiveType === "application/pdf") {
    return preferPdfEmbed ? (
      <embed src={objectUrl} type="application/pdf" width="100%" height="700px" />
    ) : (
      <iframe src={objectUrl} width="100%" height="700px" title={artifact.url ?? "PDF"} />
    );
  }

  // Fallback
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <iframe src={objectUrl} width="100%" height="700px" title={artifact.url ?? "File"} />
      <a href={objectUrl} download={artifact.url ?? "download"}>
        Download file
      </a>
    </div>
  );
};

const App: React.FC = () => {
  const params = new URLSearchParams(window.location.search);
  const format = (params.get("format") ?? "json").toLowerCase();
  const uuid = params.get("uuid") ?? "";

  const mode: ViewMode = format === "json" ? "json" : "artifact";

  if (mode === "json") {
    return (
      <React.StrictMode>
        <ApiRequestViewer autoRun />
      </React.StrictMode>
    );
  }

  if (!uuid) {
    return <div className="text-red-600">Missing uuid query param.</div>;
  }

  return <ArtifactLoader uuid={uuid} />;
};

const container = document.getElementById("app-container");
if (!container) throw new Error('Missing root element with id="app-container".');

createRoot(container).render(<App />);
