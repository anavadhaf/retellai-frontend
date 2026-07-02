const SW_URL = "/sw.js";
const UPDATE_EVENT = "aufi-sw-update";
const OFFLINE_READY_EVENT = "aufi-sw-offline-ready";

function canRegisterServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return false;
  }

  if (window.isSecureContext) {
    return true;
  }

  return ["localhost", "127.0.0.1"].includes(window.location.hostname);
}

function dispatchPwaEvent(name, detail = {}) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

function trackInstallingWorker(registration) {
  const installingWorker = registration.installing;

  if (!installingWorker) {
    return;
  }

  installingWorker.addEventListener("statechange", () => {
    if (installingWorker.state === "installed") {
      if (navigator.serviceWorker.controller) {
        console.log("Service Worker updated");
        dispatchPwaEvent(UPDATE_EVENT, { registration });
      } else {
        console.log("Offline mode enabled");
        dispatchPwaEvent(OFFLINE_READY_EVENT, { registration });
      }
    }
  });
}

export function registerServiceWorker() {
  if (!canRegisterServiceWorker()) {
    console.warn("Service Worker registration skipped because HTTPS is required.");
    return () => {};
  }

  let refreshing = false;

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register(SW_URL);
      console.log("Service Worker registered");

      trackInstallingWorker(registration);
      registration.addEventListener("updatefound", () => trackInstallingWorker(registration));

      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshing) {
          return;
        }

        refreshing = true;
        window.location.reload();
      });

      window.setInterval(() => {
        void registration.update();
      }, 60 * 60 * 1000);
    } catch (error) {
      console.error("Service Worker registration failed", error);
    }
  });

  return () => {
    window.removeEventListener("load", registerServiceWorker);
  };
}

export function applyServiceWorkerUpdate(registration) {
  registration?.waiting?.postMessage({ type: "SKIP_WAITING" });
}

export const pwaEventNames = {
  update: UPDATE_EVENT,
  offlineReady: OFFLINE_READY_EVENT,
};
