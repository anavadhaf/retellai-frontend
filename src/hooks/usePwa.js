import { useCallback, useEffect, useMemo, useState } from "react";
import {
  applyServiceWorkerUpdate,
  pwaEventNames,
} from "../pwa/registerServiceWorker";

function getStandaloneState() {
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator.standalone === true
  );
}

export function usePwa() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installSupported, setInstallSupported] = useState(false);
  const [installStatus, setInstallStatus] = useState("idle");
  const [updateRegistration, setUpdateRegistration] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [visibilityState, setVisibilityState] = useState(document.visibilityState);
  const [isStandalone, setIsStandalone] = useState(getStandaloneState());

  useEffect(() => {
    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setInstallSupported(true);
      console.log("Install prompt shown");
    };

    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setInstallSupported(false);
      setInstallStatus("installed");
      setIsStandalone(true);
      console.log("Aufi installed successfully");
    };

    const onOnline = () => {
      setIsOnline(true);
      console.log("Back online");
    };

    const onOffline = () => {
      setIsOnline(false);
      console.log("Offline mode enabled");
    };

    const onVisibilityChange = () => {
      const nextVisibility = document.visibilityState;
      setVisibilityState(nextVisibility);
      console.log("Application visibility changes", nextVisibility);

      if (nextVisibility === "hidden") {
        console.log("App moved to background");
      } else {
        console.log("App returned to foreground");
      }
    };

    const onDisplayModeChange = () => {
      const standalone = getStandaloneState();
      setIsStandalone(standalone);

      if (standalone) {
        console.log("PWA launched");
      }
    };

    const onSwUpdate = (event) => {
      setUpdateRegistration(event.detail.registration ?? null);
      setUpdateAvailable(true);
    };

    const onSwOfflineReady = () => {
      setOfflineReady(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener(pwaEventNames.update, onSwUpdate);
    window.addEventListener(pwaEventNames.offlineReady, onSwOfflineReady);
    document.addEventListener("visibilitychange", onVisibilityChange);

    const mediaQuery = window.matchMedia?.("(display-mode: standalone)");
    mediaQuery?.addEventListener?.("change", onDisplayModeChange);

    if (getStandaloneState()) {
      console.log("PWA launched");
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener(pwaEventNames.update, onSwUpdate);
      window.removeEventListener(pwaEventNames.offlineReady, onSwOfflineReady);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      mediaQuery?.removeEventListener?.("change", onDisplayModeChange);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      return false;
    }

    setInstallStatus("prompted");
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      console.log("Aufi installed successfully");
      setInstallStatus("accepted");
    } else {
      console.log("Install prompt dismissed");
      setInstallStatus("dismissed");
    }

    setDeferredPrompt(null);
    setInstallSupported(false);

    return choice.outcome === "accepted";
  }, [deferredPrompt]);

  const applyUpdate = useCallback(() => {
    if (!updateRegistration) {
      return;
    }

    applyServiceWorkerUpdate(updateRegistration);
    setUpdateAvailable(false);
  }, [updateRegistration]);

  return useMemo(
    () => ({
      installSupported,
      installStatus,
      promptInstall,
      updateAvailable,
      applyUpdate,
      offlineReady,
      isOnline,
      visibilityState,
      animationsPaused: visibilityState === "hidden",
      isStandalone,
    }),
    [
      installSupported,
      installStatus,
      updateAvailable,
      offlineReady,
      isOnline,
      visibilityState,
      isStandalone,
      promptInstall,
      applyUpdate,
    ]
  );
}
