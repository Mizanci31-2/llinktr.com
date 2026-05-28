"use client";

import { useEffect } from "react";
import { useLocation } from "wouter";

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
    __llinktrAdcashInPagePushTimer?: number;
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

  useEffect(() => {
    if (isExcludedPath(location)) return;
    if (window.__llinktrAdcashInPagePushStarted) return;

    let attempts = 0;

    const run = () => {
      attempts += 1;

      if (!window.aclib?.runInPagePush) {
        if (attempts < 20) {
          window.__llinktrAdcashInPagePushTimer = window.setTimeout(run, 300);
        }
        return;
      }

      try {
        window.aclib.runInPagePush({
          zoneId: ADCASH_IN_PAGE_PUSH_ZONE_ID,
          maxAds: 1,
        });
        window.__llinktrAdcashInPagePushStarted = true;
      } catch {
        window.__llinktrAdcashInPagePushStarted = false;
      }
    };

    run();

    return () => {
      if (window.__llinktrAdcashInPagePushTimer) {
        window.clearTimeout(window.__llinktrAdcashInPagePushTimer);
        window.__llinktrAdcashInPagePushTimer = undefined;
      }
    };
  }, [location]);

  return <div className="adcash-inpage-push-corner" aria-hidden="true" />;
}