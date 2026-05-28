"use client";

import { useEffect } from "react";
import { runAdcashOnce } from "@/lib/adcashManager";

declare global {
  interface Window {
    __llinktrAdcashStarted?: boolean;
  }
}

export default function AdcashScripts() {
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const autoTagStarted = await runAdcashOnce("autotag:mjr1pqfpo5", "AutoTag", (api) => {
        api.runAutoTag?.({ zoneId: "mjr1pqfpo5" });
      });

      if (!cancelled) window.__llinktrAdcashStarted = autoTagStarted;

      if (window.sessionStorage.getItem("llinktr.adcash.interstitial") !== "1") {
        const interstitialStarted = await runAdcashOnce("interstitial:11361054", "Interstitial", (api) => {
          // Adcash panel notu: Interstitial alaninda "Yeni gecis reklami gorunumu" acik kullanilabilir.
          // Geri sayimi devre disi birakma ayari kapali kalabilir; mobil/masaustu deneyimi daha dengeli olur.
          api.runInterstitial?.({ zoneId: "11361054" });
        });

        if (interstitialStarted) window.sessionStorage.setItem("llinktr.adcash.interstitial", "1");
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}