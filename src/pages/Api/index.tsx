// src/index.tsx
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { APIResponse, IArtifact, Props } from '../../types';
import { processApiRequest } from '../../services/api_services';
import { db } from '../../models/db/dexieDb';
import { Artifact } from '../../models/schemas/Artifact';

const ApiRequestViewer: React.FC<Props> = ({
  autoRun = true,
  pretty = 2,
  className,
}) => {
  const [result, setResult] = useState<APIResponse | Artifact | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Runs the api requests
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
    : result ?? { success: false, error: 'No result yet.' };

    return (
      <pre className={className} aria-live="polite">
        {JSON.stringify(payload, null, pretty)}
      </pre>
    );
};

const container = document.getElementById('app-container');
if (!container) {
  throw new Error('Missing root element with id="app-container".');
}

const root = createRoot(container as HTMLElement);
const params = new URLSearchParams(window.location.search);

const format = params.get('format') ?? 'json';

if(format === 'json'){
  root.render(
    <React.StrictMode>
      <ApiRequestViewer autoRun />
    </React.StrictMode>
  );
}
else{
  async function fetchData(container: HTMLElement){
    const artifact = await db.artifact.get(params.get('uuid') ?? 'not available') ?? null;
    if(artifact){
      await renderArtifact(artifact, container);
    }
  }
  fetchData(container)
}



/**
 * Render a provided Artifact (already fetched) into the container.
 */
export async function renderArtifact(
  artifact: Artifact,
  container: HTMLElement,
  {
    sandboxHtml = true,       // render text/html via sandboxed iframe.srcdoc
    preferPdfEmbed = true     // use <embed> for PDFs; set false to use <iframe>
  }: { sandboxHtml?: boolean; preferPdfEmbed?: boolean } = {}
): Promise<() => void> {
  // Cleanup previous content and any lingering object URLs
  cleanupContainer(container);

  // Decide how to display based on MIME
  const mime = artifact.mimeType.toLowerCase();
  const url = URL.createObjectURL(artifact.data);
  const disposables: Array<() => void> = [() => URL.revokeObjectURL(url)];

  // Clear + base styles
  container.innerHTML = "";
  container.style.display = "block";

  const append = (el: HTMLElement) => container.appendChild(el);

  try {
    if (mime.startsWith("image/")) {
      const img = document.createElement("img");
      img.src = url;
      img.alt = artifact.url ?? "image artifact";
      img.style.maxWidth = "100%";
      img.style.height = "auto";
      append(img);
    } else if (mime.startsWith("video/")) {
      const video = document.createElement("video");
      video.controls = true;
      video.src = url;
      video.style.width = "100%";
      append(video);
      disposables.push(() => {
        video.pause();
        video.src = "";
      });
    } else if (mime.startsWith("audio/")) {
      const audio = document.createElement("audio");
      audio.controls = true;
      audio.src = url;
      append(audio);
      disposables.push(() => {
        audio.pause();
        audio.src = "";
      });
    } else if (mime === "application/pdf") {
      if (preferPdfEmbed) {
        const embed = document.createElement("embed");
        embed.src = url;
        embed.type = "application/pdf";
        embed.width = "100%";
        embed.height = "600px";
        append(embed);
      } else {
        const iframe = document.createElement("iframe");
        iframe.src = url;
        iframe.width = "100%";
        iframe.height = "600px";
        iframe.setAttribute("title", artifact.url ?? "PDF");
        append(iframe);
      }
    } else if (mime === "text/html") {
      if (sandboxHtml) {
        // Safer: use srcdoc + sandbox (no scripts, no same-origin)
        const html = await artifact.data.text();
        const iframe = document.createElement("iframe");
        iframe.setAttribute("sandbox", "allow-forms allow-popups allow-pointer-lock allow-same-origin");
        iframe.width = "100%";
        iframe.height = "600px";
        // Use srcdoc for accurate inline rendering
        // If you need sanitization, run through DOMPurify before assignment.
        (iframe as any).srcdoc = html;
        append(iframe);
      } else {
        // Direct blob URL (less safe)
        const iframe = document.createElement("iframe");
        iframe.src = url;
        iframe.width = "100%";
        iframe.height = "600px";
        append(iframe);
      }
    } else if (mime.startsWith("text/") || mime === "application/json") {
      const text = await artifact.data.text();
      const pre = document.createElement("pre");
      pre.style.whiteSpace = "pre-wrap";
      pre.style.wordBreak = "break-word";
      pre.textContent = text;
      append(pre);
    } else {
      // Fallback: try iframe; if it fails the browser may download it.
      const iframe = document.createElement("iframe");
      iframe.src = url;
      iframe.width = "100%";
      iframe.height = "600px";
      append(iframe);

      // Provide a download link as a guaranteed fallback
      const a = document.createElement("a");
      a.href = url;
      a.download = artifact.url ?? "download";
      a.textContent = "Download file";
      a.style.display = "inline-block";
      a.style.marginTop = "8px";
      append(a);
    }
  } catch (e) {
    container.innerHTML = `<div class="text-red-600">Failed to render: ${(e as Error).message}</div>`;
  }

  // Return disposer to clean up
  const disposer = () => {
    cleanupContainer(container);
    for (const d of disposables) try { d(); } catch {}
  };
  // Store disposer on the container so future calls can auto-clean
  (container as any).__artifactDisposer = disposer;
  return disposer;
}

function cleanupContainer(container: HTMLElement) {
  const prev = (container as any).__artifactDisposer as (() => void) | undefined;
  if (prev) {
    try { prev(); } catch {}
    (container as any).__artifactDisposer = undefined;
  }
  // Pause media before clearing to free resources
  container.querySelectorAll("video,audio").forEach((m) => {
    try {
      (m as HTMLMediaElement).pause();
      (m as HTMLMediaElement).src = "";
    } catch {}
  });
  container.innerHTML = "";
}

