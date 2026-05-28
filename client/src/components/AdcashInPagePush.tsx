"use client";

import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { ensureAdcashLoaded } from "@/lib/adcashManager";

const ADCASH_IN_PAGE_PUSH_ZONE_ID = "11365886";

const EXCLUDED_ROUTE_PARTS = [
  "admin",
  "admin31",
  "checkout",
  "payment",
  "billing",
  "subscription",
  "subscribe",
  "premium",
  "plan",
  "plans",
  "odeme",
  "ödeme",
  "success",
  "failed",
  "cancel",
];

declare global {
  interface Window {
    __llinktrAdcashInPagePushStarted?: boolean;
  }
}

function normalizePath(path: string) {
  return path.toLocaleLowerCase("tr-TR").replace(/^\/+|\/+$/g, "");
}

function isExcludedPath(path: string) {
  const normalized = normalizePath(path);
  if (!normalized) return false;
  return EXCLUDED_ROUTE_PARTS.some((part) => normalized === part || normalized.startsWith(`${part}/`) || normalized.includes(`/${part}/`));
}

export default function AdcashInPagePush() {
  const [location] = useLocation();
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (isExcludedPath(location)) return;
      if (window.__llinktrAdcashInPagePushStarted) return;

      const loaded = await ensureAdcashLoaded("In-page push");
      if (cancelled || !loaded || !hostRef.current) return;
      if (window.__llinktrAdcashInPagePushStarted) return;

      window.__llinktrAdcashInPagePushStarted = true;
      hostRef.current.replaceChildren();

      const script = document.createElement("script");
      script.type = "text/javascript";
      script.text = `aclib.runInPagePush({ zoneId: '${ADCASH_IN_PAGE_PUSH_ZONE_ID}', maxAds: 1 });`;
      hostRef.current.appendChild(script);
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [location]);

  return <div ref={hostRef} className="adcash-inpage-push-corner" aria-hidden="true" />;
}