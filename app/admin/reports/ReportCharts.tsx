'use client';

import {
  Area, AreaChart, Bar, BarChart, Pie, PieChart, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
  ChartConfig,
} from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { FinancialReport } from './actions';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

const fmtShort = (n: number) => {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return fmt(n);
};

// ─── Tendencia diaria ─────────────────────────────────────────
const trendConfig: ChartConfig = {
  total: { label: 'Volumen', color: 'hsl(var(--chart-1))' },
  collected: { label: 'Cobrado', color: 'hsl(var(--chart-2))' },
};

function DailyTrendChart({ data }: { data: FinancialReport['salesByDay'] }) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">Sin datos de tendencia</div>
  );

  const fmt_date = (d: string) => {
    const [, , day] = d.split('-');
    return `${Number(day)}`;
  };

  return (
    <Card>
      <CardHeader className="px-6 py-4 border-b border-border">
        <CardTitle className="text-sm font-semibold">Tendencia de Ventas</CardTitle>
        <CardDescription className="text-xs">Volumen comprometido vs. cobrado por día</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <ChartContainer config={trendConfig} className="h-64 w-full">
          <AreaChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradCollected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={fmt_date}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={fmtShort}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              width={56}
            />
            <Tooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(label) => {
                    const d = new Date(label + 'T12:00:00');
                    return d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
                  }}
                  formatter={(value, name) => [
                    <span key="v" className="font-mono font-semibold">{fmt(Number(value))}</span>,
                    name,
                  ]}
                />
              }
            />
            <Legend content={<ChartLegendContent />} />
            <Area
              type="monotone" dataKey="total"
              stroke="hsl(var(--chart-1))" strokeWidth={2}
              fill="url(#gradTotal)"
              dot={false} activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <Area
              type="monotone" dataKey="collected"
              stroke="hsl(var(--chart-2))" strokeWidth={2}
              fill="url(#gradCollected)"
              dot={false} activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ChartContainer>

        {/* Orders per day mini bars */}
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Órdenes por día</p>
          <ChartContainer config={{ orders: { label: 'Órdenes', color: 'hsl(var(--chart-3))' } }} className="h-20 w-full">
            <BarChart data={data} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <XAxis dataKey="date" tickFormatter={fmt_date} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <Tooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(label) => {
                      const d = new Date(label + 'T12:00:00');
                      return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
                    }}
                    formatter={(v) => [<span key="o" className="font-mono">{v} órdenes</span>, '']}
                  />
                }
              />
              <Bar dataKey="orders" fill="hsl(var(--chart-3))" radius={[2, 2, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Métodos de pago ──────────────────────────────────────────
const PIE_COLORS = [
  'hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))',
  'hsl(var(--chart-4))', 'hsl(var(--chart-5))',
];

interface PaymentMethod {
  method: string;
  collected: number;
  count: number;
}

import type { PieLabelRenderProps } from 'recharts';

const CustomPieLabel = (props: PieLabelRenderProps) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
  if (!percent || percent < 0.06) return null;
  const RADIAN = Math.PI / 180;
  const r = Number(innerRadius) + (Number(outerRadius) - Number(innerRadius)) * 0.5;
  const x = Number(cx) + r * Math.cos(-(midAngle ?? 0) * RADIAN);
  const y = Number(cy) + r * Math.sin(-(midAngle ?? 0) * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

function PaymentMethodChart({ data }: { data: PaymentMethod[] }) {
  const config = Object.fromEntries(
    data.map((d) => [d.method, { label: d.method }])
  ) as ChartConfig;

  return (
    <Card>
      <CardHeader className="px-6 py-4 border-b border-border">
        <CardTitle className="text-sm font-semibold">Métodos de Pago</CardTitle>
        <CardDescription className="text-xs">Distribución del cobrado por forma de pago</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <ChartContainer config={config} className="h-56 w-full">
          <PieChart>
            <Pie
              data={data}
              dataKey="collected"
              nameKey="method"
              cx="50%"
              cy="50%"
              outerRadius={90}
              innerRadius={45}
              paddingAngle={2}
              labelLine={false}
              label={CustomPieLabel}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => [
                    <span key="v" className="font-mono font-semibold">{fmt(Number(value))}</span>,
                    name,
                  ]}
                />
              }
            />
          </PieChart>
        </ChartContainer>

        <div className="mt-4 space-y-2">
          {data.map((d, i) => {
            const total = data.reduce((s, x) => s + x.collected, 0);
            const pct = total > 0 ? (d.collected / total) * 100 : 0;
            return (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="font-medium text-foreground">{d.method}</span>
                  <span className="text-muted-foreground text-xs">({d.count} órdenes)</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-semibold text-foreground">{fmt(d.collected)}</span>
                  <span className="text-xs text-muted-foreground ml-2">{pct.toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Vendedores ───────────────────────────────────────────────
interface Seller {
  seller: string;
  total: number;
  count: number;
}

const sellerConfig: ChartConfig = {
  total: { label: 'Volumen vendido', color: 'hsl(var(--chart-4))' },
  count: { label: 'Órdenes', color: 'hsl(var(--chart-5))' },
};

function SellersChart({ data }: { data: Seller[] }) {
  const chartData = data.map((d) => ({
    ...d,
    name: d.seller.length > 14 ? d.seller.slice(0, 13) + '…' : d.seller,
  }));

  return (
    <Card>
      <CardHeader className="px-6 py-4 border-b border-border">
        <CardTitle className="text-sm font-semibold">Vendedores</CardTitle>
        <CardDescription className="text-xs">Volumen de ventas por vendedor en el período</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <ChartContainer config={sellerConfig} className="h-56 w-full">
          <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              tickFormatter={fmtShort}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false} tickLine={false}
              width={52}
            />
            <Tooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.seller ?? ''}
                  formatter={(value, name) => [
                    <span key="v" className="font-mono font-semibold">
                      {name === 'total' ? fmt(Number(value)) : `${value} órdenes`}
                    </span>,
                    name === 'total' ? 'Volumen' : 'Órdenes',
                  ]}
                />
              }
            />
            <Bar dataKey="total" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ChartContainer>

        {/* Seller table */}
        <div className="mt-4 border-t border-border pt-4 space-y-2">
          {data.map((d, i) => {
            const maxTotal = Math.max(...data.map((x) => x.total));
            const pct = maxTotal > 0 ? (d.total / maxTotal) * 100 : 0;
            return (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="font-medium text-foreground w-32 truncate shrink-0">{d.seller}</span>
                <div className="flex-1 bg-muted rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-chart-4" style={{ width: `${pct}%`, backgroundColor: 'hsl(var(--chart-4))' }} />
                </div>
                <span className="font-mono tabular-nums text-foreground font-semibold text-xs w-20 text-right shrink-0">{fmt(d.total)}</span>
                <span className="text-muted-foreground text-xs w-16 text-right shrink-0">{d.count} ord.</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Conciliación ─────────────────────────────────────────────
function ReconciliationCard({ report }: { report: FinancialReport }) {
  const { totalSales, totalCollected, pendingLayawayBalance } = report;
  const uncollected = totalSales - totalCollected;
  if (uncollected <= 0) return null;
  const collectedPct = totalSales > 0 ? (totalCollected / totalSales) * 100 : 100;

  return (
    <Card className="border-amber-200 dark:border-amber-800 bg-amber-500/5">
      <CardHeader className="px-6 py-4 border-b border-amber-200 dark:border-amber-800">
        <CardTitle className="text-sm font-semibold text-amber-700 dark:text-amber-400">Conciliación del Período</CardTitle>
        <CardDescription className="text-xs text-amber-600 dark:text-amber-500">
          Diferencia entre lo vendido y lo efectivamente cobrado
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-background rounded-lg p-3 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Volumen vendido</p>
            <p className="text-lg font-bold font-mono tabular-nums text-foreground">{fmt(totalSales)}</p>
          </div>
          <div className="bg-background rounded-lg p-3 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Cobrado</p>
            <p className="text-lg font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">{fmt(totalCollected)}</p>
          </div>
          <div className="bg-background rounded-lg p-3 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Pendiente</p>
            <p className="text-lg font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">{fmt(pendingLayawayBalance)}</p>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>Tasa de cobro</span>
            <span className="font-semibold">{collectedPct.toFixed(1)}%</span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-2.5 rounded-full transition-all bg-emerald-500"
              style={{ width: `${Math.min(collectedPct, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>{fmt(totalCollected)} cobrado</span>
            <span>{fmt(uncollected)} en separados</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Root client component ────────────────────────────────────
export default function ReportCharts({ report }: { report: FinancialReport }) {
  return (
    <div className="space-y-6">
      {/* Trend */}
      <DailyTrendChart data={report.salesByDay} />

      {/* Reconciliation */}
      <ReconciliationCard report={report} />

      {/* Payment + Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PaymentMethodChart data={report.collectedByPaymentMethod} />
        <SellersChart data={report.salesBySeller} />
      </div>
    </div>
  );
}
