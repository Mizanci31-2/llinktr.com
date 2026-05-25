type MondiadNativeAdProps = {
  className?: string;
  compact?: boolean;
};

export default function MondiadNativeAd({ className = "", compact = false }: MondiadNativeAdProps) {
  return (
    <div
      className={`mx-auto w-full ${compact ? "max-w-[420px]" : "container"} ${className}`}
      aria-label="Reklam alani"
    >
      <div
        data-mndazid="827ce39b-7d7a-4349-8fbc-3d3f12c791c9"
        className="mx-auto min-h-0 w-full max-w-full overflow-hidden"
      />
    </div>
  );
}
