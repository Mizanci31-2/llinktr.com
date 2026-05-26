"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    aclib?: {
      runAutoTag?: (config: { zoneId: string }) => void;
      runInterstitial?: (config: { zoneId: string }) => void;
    };
    __llinktrAdcashStarted?: boolean;
  }
}

export default function AdcashScripts() {
  useEffect(() => {
    if (window.__llinktrAdcashStarted) return;
    window.__llinktrAdcashStarted = true;

    let attempts = 0;
    const run = () => {
      attempts += 1;
      if (!window.aclib?.runAutoTag) {
        if (attempts < 20) window.setTimeout(run, 300);
        return;
      }

      try {
        window.aclib.runAutoTag({ zoneId: "mjr1pqfpo5" });
      } catch {
        window.__llinktrAdcashStarted = false;
      }

      if (window.sessionStorage.getItem("llinktr.adcash.interstitial") !== "1" && window.aclib.runInterstitial) {
        try {
          // Adcash panel notu: Interstitial alaninda "Yeni gecis reklami gorunumu" acik kullanilabilir.
          // Geri sayimi devre disi birakma ayari kapali kalabilir; mobil/masaustu deneyimi daha dengeli olur.
          window.aclib.runInterstitial({ zoneId: "11361054" });
          window.sessionStorage.setItem("llinktr.adcash.interstitial", "1");
        } catch {
          // Reklam saglayici hazir degilse sayfa deneyimini bozma.
        }
      }
    };

    run();
  }, []);

  return null;
}
