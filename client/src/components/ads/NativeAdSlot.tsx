type NativeAdSlotProps = {
  className?: string;
  compact?: boolean;
  placement?: "top" | "home-middle";
};

const BLOCKED_AD_ROUTE_PATTERN = /(payment|checkout|billing|odeme|\u00f6deme|plan|subscription|subscribe|success|failed|cancel)/i;

export function isAdBlockedRoute(pathname?: string) {
  if (typeof window === "undefined") return false;
  return BLOCKED_AD_ROUTE_PATTERN.test(pathname ?? window.location.pathname);
}

export default function NativeAdSlot({ className = "", compact = false, placement = "home-middle" }: NativeAdSlotProps) {
  if (isAdBlockedRoute()) return null;

  return (
    <div
      className={`mx-auto w-full ${compact ? "max-w-[420px]" : "container"} ${className}`}
      data-ad-placement={placement}
      aria-label="Reklam alani"
    >
      <div
        data-mndazid="827ce39b-7d7a-4349-8fbc-3d3f12c791c9"
        className="mx-auto block min-h-0 w-full max-w-full overflow-visible"
      />
    </div>
  );
}
