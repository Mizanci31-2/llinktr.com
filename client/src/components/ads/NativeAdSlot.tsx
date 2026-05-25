type NativeAdSlotProps = {
  className?: string;
  compact?: boolean;
  placement?: "footer" | "home-middle" | "dashboard" | "public-link-bottom";
};

const BLOCKED_AD_ROUTE_PATTERN = /(payment|checkout|billing|odeme|\u00f6deme|plan|subscription|subscribe|success|failed|cancel)/i;

export function isAdBlockedRoute(pathname?: string) {
  if (typeof window === "undefined") return false;
  return BLOCKED_AD_ROUTE_PATTERN.test(pathname ?? window.location.pathname);
}

export default function NativeAdSlot({ className = "", compact = false, placement = "footer" }: NativeAdSlotProps) {
  if (isAdBlockedRoute()) return null;

  return (
    <div
      className={`relative z-[1] mx-auto min-h-px w-full overflow-visible ${compact ? "max-w-[420px]" : "container"} ${className}`}
      data-ad-placement={placement}
      aria-label="Reklam alani"
    >
      <div data-mndazid="827ce39b-7d7a-4349-8fbc-3d3f12c791c9"></div>
    </div>
  );
}
