// src/index.tsx
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { APIResponse, Props } from '../../types';
import { processApiRequest } from '../../services/api_services';

const ApiRequestViewer: React.FC<Props> = ({ autoRun = true, pretty = 2, className }) => {
  const [result, setResult] = useState<APIResponse | null>(null);
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
root.render(
  <React.StrictMode>
    <ApiRequestViewer autoRun />
  </React.StrictMode>
);