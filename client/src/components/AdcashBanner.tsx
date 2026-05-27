"use client";

import { useEffect, useRef } from "react";

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
    const bannerKey = `${placement}:${ADCASH_BANNER_ZONE_ID}`;
    window.__llinktrAdcashBanners = window.__llinktrAdcashBanners ?? {};

    if (window.__llinktrAdcashBanners[bannerKey]) return;

    let attempts = 0;
    let timeoutId: number | undefined;

    const runBanner = () => {
      attempts += 1;

      if (!containerRef.current) return;

      if (!window.aclib?.runBanner) {
        if (attempts < 20) timeoutId = window.setTimeout(runBanner, 300);
        return;
      }

      window.__llinktrAdcashBanners![bannerKey] = true;

      const script = document.createElement("script");
      script.type = "text/javascript";
      script.text = `aclib.runBanner({ zoneId: '${ADCASH_BANNER_ZONE_ID}' });`;
      containerRef.current.appendChild(script);
    };

    runBanner();

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [placement]);

  return (
    <div className={`adcash-banner-shell ${className}`.trim()} aria-label="Ad area">
      <div ref={containerRef} className="adcash-banner adcash-banner-300x250" />
    </div>
  );
}
