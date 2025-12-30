/**
 * Write a blob to the downloads directory. This is a pro feature that offers the ability to sync data to your native
 * file system
 */
export async function downloadViaBlobUrl(
  data: BlobPart[],
  filename: string,
  mime: string
): Promise<number> {
  const blob = new Blob(data, { type: mime });
  const url = URL.createObjectURL(blob);

  try {
    const downloadId = await chrome.downloads.download({
      url,
      filename: filename, // relative to Downloads dir; can include subfolders
      saveAs: false,
      conflictAction: "overwrite",
    });

    // Revoke URL after completion/interruption.
    const onChanged = (delta: chrome.downloads.DownloadDelta) => {
      if (delta.id !== downloadId) return;
      const st = delta.state?.current;
      if (st === "complete" || st === "interrupted") {
        chrome.downloads.onChanged.removeListener(onChanged);
        URL.revokeObjectURL(url);
      }
    };
    chrome.downloads.onChanged.addListener(onChanged);

    return downloadId;
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);

  // Convert bytes to a binary string for btoa
  // Chunking avoids "Maximum call stack size exceeded" for larger buffers.
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}


export async function blobToDataUrl(blob: Blob): Promise<string> {
  // Using blob.arrayBuffer() is service-worker-friendly and mirrors the SO base64 approach :contentReference[oaicite:2]{index=2}
  const buffer = await blob.arrayBuffer();
  const base64 = arrayBufferToBase64(buffer);
  return `data:${blob.type};base64,${base64}`;
}

export async function downloadDataUrl(dataUrl: string, filename: string): Promise<number> {
  return await chrome.downloads.download({
    url: dataUrl,
    filename,
    saveAs: false,
    conflictAction: "overwrite"
  });
}