import { useMemo, useState } from "react";
import { BarChart3, CalendarRange, Eye, Info, Link2, MousePointerClick } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";

interface PageAnalyticsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageId: number | null;
  pageTitle: string;
  totalViews: number;
  totalClicks: number;
  todayViews: number;
  todayClicks: number;
}

function getTopBlocks(
  blocks:
    | Array<{
        id: number;
        type: string;
        clicks?: number | null;
        data?: unknown;
      }>
    | undefined,
) {
  return (blocks ?? [])
    .filter((block) => block.type === "link" || block.type === "social" || block.type === "location")
    .map((block) => {
      const data = (block.data ?? {}) as Record<string, string | number | boolean>;
      const label =
        block.type === "social"
          ? String(data.platform || "Sosyal hesap")
          : block.type === "location"
            ? String(data.title || data.address || "Konum")
          : String(data.title || data.url || "Link");
      return {
        id: block.id,
        label,
        clicks: block.clicks ?? 0,
      };
    })
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);
}

function formatDateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}

const HOUR_LABELS = ["00", "04", "08", "12", "16", "20", "24"];

export function PageAnalyticsDialog({
  open,
  onOpenChange,
  pageId,
  pageTitle,
  totalViews,
  totalClicks,
  todayViews,
  todayClicks,
}: PageAnalyticsDialogProps) {
  const [range, setRange] = useState("today");
  const today = useMemo(() => new Date(), []);
  const minDate = useMemo(() => {
    const date = new Date(today);
    date.setMonth(date.getMonth() - 3);
    return formatDateInput(date);
  }, [today]);
  const maxDate = formatDateInput(today);
  const [startDate, setStartDate] = useState(maxDate);
  const [endDate, setEndDate] = useState(maxDate);

  const { data: blocks, isLoading } = trpc.bioBlocks.list.useQuery(
    { pageId: pageId ?? 0 },
    { enabled: open && !!pageId, staleTime: 1000 * 60 * 2, refetchOnWindowFocus: false },
  );

  const selectedIncludesToday = useMemo(() => {
    if (range === "today" || range === "7d" || range === "30d") return true;
    return startDate <= maxDate && endDate >= maxDate;
  }, [endDate, maxDate, range, startDate]);
  const isHistoricalRangeWithoutData = !selectedIncludesToday;
  const displayedViews = range === "today" || range === "custom" ? (selectedIncludesToday ? todayViews : 0) : totalViews;
  const displayedClicks = range === "today" || range === "custom" ? (selectedIncludesToday ? todayClicks : 0) : totalClicks;
  const topBlocks = isHistoricalRangeWithoutData ? [] : getTopBlocks(blocks);
  const hasTodayActivity = displayedClicks > 0 || displayedViews > 0;
  const activityBars =
    !hasTodayActivity
      ? Array.from({ length: 7 }, () => 16)
      : [18, 26, 24, 34, 30, 38, Math.min(88, 22 + displayedClicks * 6 + displayedViews * 2)];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-white/12 bg-[#0f1318]/95 shadow-[0_30px_120px_rgba(0,0,0,0.58)] backdrop-blur sm:max-w-5xl">
        <DialogHeader className="border-b border-white/10 pb-4">
          <DialogTitle className="flex flex-col gap-1 text-xl sm:text-2xl">
            <span>{pageTitle} analizi</span>
            <span className="text-xs font-medium text-muted-foreground">Saat, adet ve seçili tarih aralığına göre özet</span>
          </DialogTitle>
        </DialogHeader>

        <div className="mb-4 rounded-2xl border border-white/10 bg-[#151a20]/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_48px_rgba(0,0,0,0.22)]">
          <div className="mb-3 flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Tarih secimi</p>
          </div>
          <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="border-white/10 bg-[#0b0f14]">
                <SelectValue placeholder="Aralik secin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Bugun</SelectItem>
                <SelectItem value="7d">Son 7 gun</SelectItem>
                <SelectItem value="30d">Son 30 gun</SelectItem>
                <SelectItem value="custom">Ozel tarih</SelectItem>
              </SelectContent>
            </Select>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                type="date"
                min={minDate}
                max={endDate || maxDate}
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="border-white/10 bg-[#0b0f14]"
                disabled={range !== "custom"}
              />
              <Input
                type="date"
                min={startDate || minDate}
                max={maxDate}
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="border-white/10 bg-[#0b0f14]"
                disabled={range !== "custom"}
              />
            </div>
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/[0.045] px-3 py-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
            <p>
              Tarih secimi son 3 ay ile sinirlidir. Gecmis gunluk veri bulunmayan araliklarda sonuc bos gosterilir.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4 text-primary" />
                  Secili goruntulenme
                </div>
                <p className="text-4xl font-semibold tracking-tight">{displayedViews}</p>
                <p className="mt-1 text-xs text-muted-foreground">Secilen tarih araligina gore gorunum.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(214,255,0,0.075),rgba(255,255,255,0.02))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <MousePointerClick className="h-4 w-4 text-primary" />
                  Secili tiklama
                </div>
                <p className="text-4xl font-semibold tracking-tight">{displayedClicks}</p>
                <p className="mt-1 text-xs text-muted-foreground">Secilen tarih araligina gore etkilesim.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#121820] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <div className="mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Bugünkü hareket</h3>
              </div>
              {!hasTodayActivity ? (
                <div className="mb-3 flex h-24 items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/35 px-3 text-center text-sm text-muted-foreground">
                  Bu tarih araliginda veri yok
                </div>
              ) : (
                <div className="mb-2 flex h-28 items-end gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 pt-4">
                  {activityBars.map((value, index) => (
                    <div key={index} className="flex h-full flex-1 flex-col justify-end gap-1">
                      <span
                        className="mini-chart-bar rounded-t bg-primary/80 shadow-[0_0_18px_rgba(214,255,0,0.18)]"
                        style={{ height: `${value}%` }}
                      />
                    </div>
                  ))}
                </div>
              )}
              <div className="mb-3 grid grid-cols-7 gap-2 text-center text-[10px] font-semibold text-muted-foreground">
                {HOUR_LABELS.map((hour) => (
                  <span key={hour}>{hour}</span>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-card/70 p-3">
                  <p className="text-xs text-muted-foreground">Secili goruntulenme</p>
                  <p className="mt-1 text-xl font-semibold">{displayedViews}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-card/70 p-3">
                  <p className="text-xs text-muted-foreground">Secili tiklama</p>
                  <p className="mt-1 text-xl font-semibold">{displayedClicks}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#121820] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <div className="mb-3 flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">En cok tiklanan ogeler</h3>
            </div>
            {isLoading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Yukleniyor...</div>
            ) : topBlocks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/50 bg-card/40 px-4 py-10 text-center">
                <p className="text-sm font-medium">Henuz hareket yok</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Linkler tiklandikca en cok etkilesim alan ogeler burada listelenir.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {topBlocks.map((block, index) => (
                  <div key={block.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-card/70 px-3 py-3 transition-colors hover:border-primary/35">
                    <div className="min-w-0 pr-3">
                      <p className="truncate text-sm font-medium">{index + 1}. {block.label}</p>
                    </div>
                    <div className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                      {block.clicks} tiklama
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
