const blockedAdPathPattern = /(payment|checkout|billing|plan|subscription|subscribe|odeme|ödeme|success|failed|cancel)/i;

export function shouldShowNativeAd(pathname = typeof window !== "undefined" ? window.location.pathname : "") {
  return !blockedAdPathPattern.test(pathname);
}

export default function NativeAdSlot({ className = "" }: { className?: string }) {
  if (!shouldShowNativeAd()) return null;

  return (
    <div className={`native-ad-wrapper w-full overflow-hidden border-white/10 bg-black px-3 py-4 ${className}`}>
      <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-[14px] border border-white/10 bg-[#0b0b0b] p-3">
        <div data-mndazid="827ce39b-7d7a-4349-8fbc-3d3f12c791c9"></div>
      </div>
    </div>
  );
}
