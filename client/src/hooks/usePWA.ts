/**
 * usePWA — Service Worker registration and PWA lifecycle hook.
 *
 * Registers the service worker, tracks update availability,
 * and provides a function to trigger SW updates.
 */

import { useState, useEffect } from "react";

export interface PWAState {
  isInstalled: boolean;
  isUpdateAvailable: boolean;
  updateSW: () => void;
}

export function usePWA(): PWAState {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Register service worker
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        setRegistration(reg);

        // Check if already controlled (installed)
        if (navigator.serviceWorker.controller) {
          setIsInstalled(true);
        }

        // Listen for updates
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setIsUpdateAvailable(true);
            }
          });
        });
      })
      .catch((err) => {
        // SW registration failed — non-critical, app still works
        console.warn("[PWA] Service worker registration failed:", err);
      });

    // Listen for controller change (after update)
    const handleControllerChange = () => {
      setIsInstalled(true);
      setIsUpdateAvailable(false);
    };
    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  const updateSW = () => {
    if (!registration?.waiting) return;
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
    window.location.reload();
  };

  return { isInstalled, isUpdateAvailable, updateSW };
}
