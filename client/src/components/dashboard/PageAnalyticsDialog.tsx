import { useMemo, useState } from "react";
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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

type ChartPoint = {
  label: string;
  tooltipLabel: string;
  views: number;
  clicks: number;
};

const dayNames = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
const hourTicks = [0, 4, 8, 12, 16, 20, 24];

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
      return { id: block.id, label, clicks: block.clicks ?? 0 };
    })
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);
}

function formatDateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

function parseDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function formatDayLabel(date: Date) {
  return dayNames[date.getDay()];
}

function formatDateLabel(date: Date) {
  return date.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
}

function getNiceStep(maxValue: number) {
  if (maxValue <= 0) return 1;
  const rawStep = maxValue / 4;
  const power = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / power;
  const multiplier = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return multiplier * power;
}

function buildYAxisTicks(maxValue: number) {
  const step = getNiceStep(maxValue);
  const top = Math.max(step * 4, Math.ceil(maxValue / step) * step);
  return Array.from({ length: Math.floor(top / step) + 1 }, (_, index) => index * step);
}

function buildChartData(params: {
  range: string;
  startDate: string;
  endDate: string;
  maxDate: string;
  totalViews: number;
  totalClicks: number;
  todayViews: number;
  todayClicks: number;
}) {
  const { range, startDate, endDate, maxDate, totalViews, totalClicks, todayViews, todayClicks } = params;
  const selectedIncludesToday = range === "today" || range === "7d" || range === "30d" || (startDate <= maxDate && endDate >= maxDate);
  const today = parseDate(maxDate);

  if (!selectedIncludesToday) {
    return {
      selectedIncludesToday,
      displayedViews: 0,
      displayedClicks: 0,
      points: [] as ChartPoint[],
    };
  }

  if (range === "today") {
    const currentHour = new Date().getHours();
    const activeTick = hourTicks.reduce((closest, tick) => (Math.abs(tick - currentHour) < Math.abs(closest - currentHour) ? tick : closest), 0);
    return {
      selectedIncludesToday,
      displayedViews: todayViews,
      displayedClicks: todayClicks,
      points: hourTicks.map((hour) => ({
        label: String(hour).padStart(2, "0"),
        tooltipLabel: `Saat: ${String(hour).padStart(2, "0")}:00`,
        views: hour === activeTick ? todayViews : 0,
        clicks: hour === activeTick ? todayClicks : 0,
      })),
    };
  }

  const dayCount = range === "7d" ? 7 : range === "30d" ? 30 : Math.max(1, Math.min(90, Math.round((parseDate(endDate).getTime() - parseDate(startDate).getTime()) / 86400000) + 1));
  const start = range === "custom" ? parseDate(startDate) : addDays(today, -(dayCount - 1));
  const views = range === "custom" ? todayViews : totalViews;
  const clicks = range === "custom" ? todayClicks : totalClicks;
  const labelEvery = dayCount <= 10 ? 1 : Math.ceil(dayCount / 6);

  return {
    selectedIncludesToday,
    displayedViews: views,
    displayedClicks: clicks,
    points: Array.from({ length: dayCount }, (_, index) => {
      const date = addDays(start, index);
      const isLast = index === dayCount - 1;
      return {
        label: dayCount <= 10 ? formatDayLabel(date) : index % labelEvery === 0 || isLast ? formatDateLabel(date) : "",
        tooltipLabel: `Tarih: ${date.toLocaleDateString("tr-TR")}`,
        views: isLast ? views : 0,
        clicks: isLast ? clicks : 0,
      };
    }),
  };
}

function AnalyticsTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string; payload: ChartPoint }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  return (
    <div className="rounded-xl border border-white/10 bg-[#080b0f]/95 px-3 py-2 text-xs shadow-2xl">
      <p className="mb-1 font-semibold text-white">{point?.tooltipLabel || label}</p>
      {payload.map((item) => (
        <p key={item.name} style={{ color: item.color }}>
          {item.name}: {item.value}
        </p>
      ))}
    </div>
  );
}

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

  const chart = useMemo(
    () => buildChartData({ range, startDate, endDate, maxDate, totalViews, totalClicks, todayViews, todayClicks }),
    [endDate, maxDate, range, startDate, todayClicks, todayViews, totalClicks, totalViews],
  );
  const maxMetric = Math.max(...chart.points.map((point) => Math.max(point.views, point.clicks)), chart.displayedViews, chart.displayedClicks, 0);
  const yTicks = buildYAxisTicks(maxMetric);
  const hasData = chart.points.some((point) => point.views > 0 || point.clicks > 0);
  const topBlocks = chart.selectedIncludesToday ? getTopBlocks(blocks) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-white/12 bg-[#0f1318]/95 shadow-[0_30px_120px_rgba(0,0,0,0.58)] backdrop-blur sm:max-w-6xl">
        <DialogHeader className="border-b border-white/10 pb-4">
          <DialogTitle className="flex flex-col gap-1 text-xl sm:text-2xl">
            <span>{pageTitle} analizi</span>
            <span className="text-xs font-medium text-muted-foreground">Seçili tarih aralığına göre görüntülenme ve tıklama grafiği</span>
          </DialogTitle>
        </DialogHeader>

        <div className="mb-4 rounded-2xl border border-white/10 bg-[#151a20]/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_48px_rgba(0,0,0,0.22)]">
          <div className="mb-3 flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Tarih seçimi</p>
          </div>
          <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="border-white/10 bg-[#0b0f14]">
                <SelectValue placeholder="Aralık seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Bugün</SelectItem>
                <SelectItem value="7d">Son 7 gün</SelectItem>
                <SelectItem value="30d">Son 30 gün</SelectItem>
                <SelectItem value="custom">Özel tarih</SelectItem>
              </SelectContent>
            </Select>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input type="date" min={minDate} max={endDate || maxDate} value={startDate} onChange={(event) => setStartDate(event.target.value)} className="border-white/10 bg-[#0b0f14]" disabled={range !== "custom"} />
              <Input type="date" min={startDate || minDate} max={maxDate} value={endDate} onChange={(event) => setEndDate(event.target.value)} className="border-white/10 bg-[#0b0f14]" disabled={range !== "custom"} />
            </div>
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/[0.045] px-3 py-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
            <p>Geçmiş saatlik/günlük kayıt olmayan aralıklarda grafik boş görünür; mevcut toplamlar gerçek kayıt alanlarından okunur.</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.45fr_0.85fr]">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4 text-primary" />
                  Seçili görüntülenme
                </div>
                <p className="text-4xl font-semibold tracking-tight">{chart.displayedViews}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(214,255,0,0.075),rgba(255,255,255,0.02))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <MousePointerClick className="h-4 w-4 text-primary" />
                  Seçili tıklama
                </div>
                <p className="text-4xl font-semibold tracking-tight">{chart.displayedClicks}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#121820] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">Performans grafiği</h3>
                </div>
                <div className="text-xs text-muted-foreground">Y ekseni otomatik ölçeklenir</div>
              </div>
              {!hasData ? (
                <div className="flex h-[320px] items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/35 px-3 text-center text-sm text-muted-foreground">
                  Bu tarih aralığında veri bulunamadı
                </div>
              ) : (
                <div className="h-[320px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chart.points} margin={{ top: 12, right: 12, bottom: 8, left: 0 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.58)", fontSize: 11 }} axisLine={{ stroke: "rgba(255,255,255,0.12)" }} tickLine={false} interval={0} />
                      <YAxis ticks={yTicks} domain={[0, yTicks[yTicks.length - 1] || 1]} tick={{ fill: "rgba(255,255,255,0.58)", fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
                      <Tooltip content={<AnalyticsTooltip />} cursor={{ fill: "rgba(214,255,0,0.055)" }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="views" name="Görüntülenme" fill="rgba(214,255,0,0.62)" radius={[8, 8, 0, 0]} maxBarSize={34} />
                      <Line type="monotone" dataKey="clicks" name="Tıklama" stroke="#DFFF00" strokeWidth={3} dot={{ r: 4, fill: "#DFFF00", stroke: "#0f1318", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#121820] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <div className="mb-3 flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">En çok tıklanan öğeler</h3>
            </div>
            {isLoading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Yükleniyor...</div>
            ) : topBlocks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/50 bg-card/40 px-4 py-10 text-center">
                <p className="text-sm font-medium">Henüz hareket yok</p>
                <p className="mt-1 text-xs text-muted-foreground">Linkler tıklandıkça en çok etkileşim alan öğeler burada listelenir.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {topBlocks.map((block, index) => (
                  <div key={block.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-card/70 px-3 py-3 transition-colors hover:border-primary/35">
                    <p className="min-w-0 truncate text-sm font-medium">{index + 1}. {block.label}</p>
                    <div className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                      {block.clicks} tıklama
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
