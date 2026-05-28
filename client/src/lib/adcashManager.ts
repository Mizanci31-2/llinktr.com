export type AdcashApi = {
  runAutoTag?: (config: { zoneId: string }) => void;
  runInterstitial?: (config: { zoneId: string }) => void;
  runBanner?: (config: { zoneId: string }) => void;
  runInPagePush?: (config: { zoneId: string; maxAds?: number }) => void;
};

type AdcashStore = {
  loadPromise?: Promise<boolean>;
  loaded?: boolean;
  started: Record<string, boolean>;
};

declare global {
  interface Window {
    aclib?: AdcashApi;
    __llinktrAdcash?: AdcashStore;
  }
}

const ADCASH_SCRIPT_ID = "aclib";
const ADCASH_SCRIPT_SRC = "https://acscdn.com/script/aclib.js";

function getStore() {
  window.__llinktrAdcash = window.__llinktrAdcash ?? { started: {} };
  return window.__llinktrAdcash;
}

function hasAdcashApi() {
  return Boolean(
    window.aclib &&
      (window.aclib.runAutoTag || window.aclib.runInterstitial || window.aclib.runBanner || window.aclib.runInPagePush),
  );
}

function ensureScriptElement() {
  let script = document.getElementById(ADCASH_SCRIPT_ID) as HTMLScriptElement | null;

  if (!script) {
    script = document.createElement("script");
    script.id = ADCASH_SCRIPT_ID;
    script.type = "text/javascript";
    script.src = ADCASH_SCRIPT_SRC;
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    document.head.prepend(script);
    return script;
  }

  if (!script.src) script.src = ADCASH_SCRIPT_SRC;
  return script;
}

export function ensureAdcashLoaded(label = "adcash", maxAttempts = 40, intervalMs = 250) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.resolve(false);
  }

  const store = getStore();
  if (store.loaded && hasAdcashApi()) return Promise.resolve(true);
  if (store.loadPromise) return store.loadPromise;

  store.loadPromise = new Promise<boolean>((resolve) => {
    const script = ensureScriptElement();
    let attempts = 0;
    let settled = false;

    const finish = (loaded: boolean) => {
      if (settled) return;
      settled = true;
      store.loaded = loaded;
      if (!loaded) {
        console.warn(`[llinktr ads] ${label}: Adcash library could not be loaded. Adblock, consent, network or provider fill may be blocking ads.`);
      }
      resolve(loaded);
    };

    const poll = () => {
      attempts += 1;
      if (hasAdcashApi()) {
        finish(true);
        return;
      }

      if (attempts >= maxAttempts) {
        finish(false);
        return;
      }

      window.setTimeout(poll, intervalMs);
    };

    script.addEventListener("load", poll, { once: true });
    script.addEventListener("error", () => finish(false), { once: true });
    poll();
  });

  return store.loadPromise;
}

export async function runAdcash(label: string, runner: (api: AdcashApi) => void) {
  const loaded = await ensureAdcashLoaded(label);
  if (!loaded || !window.aclib) return false;

  try {
    runner(window.aclib);
    return true;
  } catch (error) {
    console.warn(`[llinktr ads] ${label}: Adcash call failed.`, error);
    return false;
  }
}

export async function runAdcashOnce(key: string, label: string, runner: (api: AdcashApi) => void) {
  if (typeof window === "undefined") return false;
  const store = getStore();
  if (store.started[key]) return true;

  const ok = await runAdcash(label, runner);
  if (ok) store.started[key] = true;
  return ok;
}