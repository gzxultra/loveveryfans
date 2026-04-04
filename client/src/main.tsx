import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Lazy-load Sentry to avoid blocking initial render (~30KB+ gzipped)
const initSentry = async () => {
  try {
    const Sentry = await import("@sentry/react");
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
      tracesSampleRate: 0.5,
      replaysSessionSampleRate: 0.05,
      replaysOnErrorSampleRate: 1.0,
    });
  } catch (e) {
    // Sentry failed to load, continue without it
    console.warn("Sentry initialization failed:", e);
  }
};

// Initialize Sentry after idle or 3s timeout
if ("requestIdleCallback" in window) {
  (window as any).requestIdleCallback(() => initSentry(), { timeout: 3000 });
} else {
  setTimeout(initSentry, 2000);
}

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
root.render(<App onReady={onReady} />);
