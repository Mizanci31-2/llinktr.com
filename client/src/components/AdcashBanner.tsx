"use client";

import { useEffect, useRef } from "react";
import { ensureAdcashLoaded } from "@/lib/adcashManager";

const ADCASH_BANNER_ZONE_ID = "11364126";

declare global {
  interface Window {
    __llinktrAdcashBanners?: Record<string, boolean>;
  }
}

type AdcashBannerProps = {
  placement: "footer" | "home-middle";
  className?: string;
};

export default function AdcashBanner({ placement, className = "" }: AdcashBannerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const bannerKey = `${placement}:${ADCASH_BANNER_ZONE_ID}`;
    window.__llinktrAdcashBanners = window.__llinktrAdcashBanners ?? {};

    if (window.__llinktrAdcashBanners[bannerKey]) return;

    const runBanner = async () => {
      const loaded = await ensureAdcashLoaded(`Banner ${placement}`);
      if (cancelled || !loaded || !containerRef.current) return;
      if (window.__llinktrAdcashBanners?.[bannerKey]) return;

      window.__llinktrAdcashBanners![bannerKey] = true;
      containerRef.current.replaceChildren();

      const script = document.createElement("script");
      script.type = "text/javascript";
      script.text = `aclib.runBanner({ zoneId: '${ADCASH_BANNER_ZONE_ID}' });`;
      containerRef.current.appendChild(script);
    };

    void runBanner();

    return () => {
      cancelled = true;
    };
  }, [placement]);

  return (
    <div className={`adcash-banner-shell ${className}`.trim()} aria-label="Ad area">
      <div ref={containerRef} className="adcash-banner adcash-banner-300x250" />
    </div>
  );
}