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
  if (
    m === "text/javascript" ||
    m === "application/javascript" ||
    u.endsWith(".js")
  )
    return "javascript";
  if (
    m === "text/typescript" ||
    u.endsWith(".ts") ||
    u.endsWith(".tsx")
  )
    return "typescript";
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
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as MonacoTheme)}
          >
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

const ApiRequestViewer: React.FC<Props> = ({
  autoRun = true,
  pretty = 2,
  className,
}) => {
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

  return <ArtifactViewer artifact={artifact} sandboxHtml preferPdfEmbed />;
};

const SandboxedHtmlFrame: React.FC<{ blob: Blob; title: string }> = ({ blob, title }) => {
  const [html, setHtml] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const t = await blob.text();
        if (!cancelled) setHtml(t);
      } catch {
        if (!cancelled) setHtml("<p>Failed to load HTML</p>");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [blob]);

  return (
    <iframe
      title={title}
      width="100%"
      height="700px"
      sandbox="allow-forms allow-popups allow-pointer-lock allow-same-origin"
      srcDoc={html}
    />
  );
};

const ArtifactViewer: React.FC<{
  artifact: Artifact;
  sandboxHtml?: boolean;
  preferPdfEmbed?: boolean;
}> = ({ artifact, sandboxHtml = true, preferPdfEmbed = true }) => {
  const mime = (artifact?.mimeType || "").toLowerCase();

  const objectUrl = useMemo(() => URL.createObjectURL(artifact.data), [artifact.data]);
  useEffect(() => {
    return () => {
      try {
        URL.revokeObjectURL(objectUrl);
      } catch {
        // ignore
      }
    };
  }, [objectUrl]);

  // Read texty artifacts for Monaco
  const [text, setText] = useState<string | null>(null);
  const [textErr, setTextErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const isTexty =
      mime.startsWith("text/") ||
      mime === "application/json" ||
      mime === "application/xml";

    if (!isTexty) return;

    (async () => {
      try {
        const t = await artifact.data.text();
        if (!cancelled) setText(t);
      } catch (e) {
        if (!cancelled) setTextErr(e instanceof Error ? e.message : String(e));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [artifact.data, mime]);

  // Images
  if (mime.startsWith("image/")) {
    return (
      <img
        src={objectUrl}
        alt={artifact.url ?? "image artifact"}
        style={{ maxWidth: "100%", height: "auto" }}
      />
    );
  }

  // Video
  if (mime.startsWith("video/")) {
    return <video controls src={objectUrl} style={{ width: "100%" }} />;
  }

  // Audio
  if (mime.startsWith("audio/")) {
    return <audio controls src={objectUrl} style={{ width: "100%" }} />;
  }

  // PDF
  if (mime === "application/pdf") {
    return preferPdfEmbed ? (
      <embed src={objectUrl} type="application/pdf" width="100%" height="700px" />
    ) : (
      <iframe src={objectUrl} width="100%" height="700px" title={artifact.url ?? "PDF"} />
    );
  }

  // HTML
  if (mime === "text/html") {
    return sandboxHtml ? (
      <SandboxedHtmlFrame blob={artifact.data} title={artifact.url ?? "HTML"} />
    ) : (
      <iframe src={objectUrl} width="100%" height="700px" title={artifact.url ?? "HTML"} />
    );
  }

  // Text / JSON / XML => Monaco
  if (mime.startsWith("text/") || mime === "application/json" || mime === "application/xml") {
    if (textErr) return <div className="text-red-600">Failed to read text: {textErr}</div>;
    if (text == null) return <div>Loading text…</div>;

    const lang = guessLanguage(mime, artifact.url);

    const value =
      lang === "json"
        ? (() => {
            try {
              return JSON.stringify(JSON.parse(text), null, 2);
            } catch {
              return text; // keep raw if invalid json
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
