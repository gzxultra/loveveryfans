import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App";
import "./index.css";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

// Swap SSR shell with React root when React has fully rendered
const onReady = () => {
  requestAnimationFrame(() => {
    // Start cross-fade: show React root and hide SSR shell simultaneously
    const rootEl = document.getElementById('root');
    const shell = document.getElementById('ssr-shell');
    
    if (rootEl) {
      rootEl.classList.add('ready');
    }
    
    if (shell) {
      shell.classList.add('hidden');
      // After fade-out transition completes, remove from DOM
      setTimeout(() => {
        shell.classList.add('removed');
        setTimeout(() => shell.remove(), 50);
      }, 300); // Match CSS transition duration
    }
  });
};

const root = createRoot(document.getElementById("root")!);
root.render(
  <Sentry.ErrorBoundary fallback={<p>An error has occurred</p>}>
    <App onReady={onReady} />
  </Sentry.ErrorBoundary>
);
