// app/admin/reports/page.tsx
import { getFinancialReport, type LayawayOrderSummary } from './actions';
import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/admin/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import ReportCharts from './ReportCharts';
import TopProductsChart from '@/components/admin/TopProductsChart';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

// ─── KPI card ────────────────────────────────────────────────
function KpiCard({ title, value, sub, trend }: {
  title: string; value: string; sub?: string;
  trend?: { label: string; positive: boolean };
}) {
  return (
    <Card>
      <CardHeader className="px-4 pt-4 pb-1">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <p className="text-2xl font-semibold font-mono tabular-nums text-foreground leading-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        {trend && (
          <p className={`text-xs font-medium mt-1 ${trend.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {trend.positive ? '↑' : '↓'} {trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Section wrapper ──────────────────────────────────────────
function Section({ title, description, children }: {
  title: string; description?: string; children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="px-6 py-4 border-b border-border">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        {description && <CardDescription className="text-xs mt-0.5">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="p-6">{children}</CardContent>
    </Card>
  );
}

// ─── Layaway table ────────────────────────────────────────────
function LayawayTable({ orders }: { orders: LayawayOrderSummary[] }) {
  if (!orders.length) return null;
  const totalPending = orders.reduce((s, o) => s + o.remaining_balance, 0);
  return (
    <Section
      title={`Separados con saldo pendiente (${orders.length})`}
      description="Clientes que tienen un anticipo pagado pero aún deben un saldo"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['Orden', 'Cliente', 'Fecha', 'Total', 'Anticipo', 'Saldo pendiente', ''].map((h, i) => (
                <th key={i} className={`py-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide ${i > 2 ? 'text-right' : 'text-left'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-accent/50 transition-colors">
                <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8).toUpperCase()}</td>
                <td className="py-2.5 px-3 font-medium text-foreground">{o.customer_name}</td>
                <td className="py-2.5 px-3 text-muted-foreground text-xs">{new Date(o.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-muted-foreground">{fmt(o.order_total)}</td>
                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-600">{fmt(o.down_payment)}</td>
                <td className="py-2.5 px-3 text-right">
                  <span className="inline-block bg-destructive/10 text-destructive font-semibold px-2 py-0.5 rounded text-xs font-mono">{fmt(o.remaining_balance)}</span>
                </td>
                <td className="py-2.5 px-3 text-right">
                  <a href={`/admin/orders/${o.id}/manage`} className="text-xs font-medium text-primary hover:underline">Ver →</a>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border bg-muted/30">
              <td colSpan={5} className="py-2.5 px-3 font-semibold text-foreground text-right text-sm">Total pendiente</td>
              <td className="py-2.5 px-3 text-right">
                <span className="inline-block bg-destructive/10 text-destructive font-bold px-2 py-0.5 rounded font-mono">{fmt(totalPending)}</span>
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </Section>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default async function ReportsPage({ searchParams }: {
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
}) {
  const params = await searchParams;
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];
  const startDate = params.startDate || firstDayOfMonth;
  const endDate = params.endDate || todayStr;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Reportes"
        description="Análisis financiero y de tendencias del período seleccionado"
      />

      {/* Date filter */}
      <Card>
        <CardContent className="p-4">
          <form method="GET" className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Fecha inicio</label>
              <input type="date" name="startDate" defaultValue={startDate}
                className="rounded-md border border-input px-3 py-2 text-sm text-foreground bg-background focus:ring-2 focus:ring-ring focus:border-ring outline-none transition h-9" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Fecha fin</label>
              <input type="date" name="endDate" defaultValue={endDate}
                className="rounded-md border border-input px-3 py-2 text-sm text-foreground bg-background focus:ring-2 focus:ring-ring focus:border-ring outline-none transition h-9" />
            </div>
            <Button type="submit" size="sm">Generar reporte</Button>
          </form>
        </CardContent>
      </Card>

      <Suspense key={startDate + endDate} fallback={<ReportSkeleton />}>
        <ReportContent startDate={startDate} endDate={endDate} />
      </Suspense>
    </div>
  );
}

// ─── Report content (server) ──────────────────────────────────
async function ReportContent({ startDate, endDate }: { startDate: string; endDate: string }) {
  const report = await getFinancialReport(startDate, endDate);

  if (report.totalOrders === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <span className="text-5xl mb-4">📊</span>
        <p className="text-base font-medium">Sin ventas en este período</p>
        <p className="text-sm mt-1">Selecciona otro rango de fechas</p>
      </div>
    );
  }

  const collectionRate = report.totalSales > 0
    ? (report.totalCollected / report.totalSales) * 100
    : 100;

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Volumen de ventas"
          value={fmt(report.totalSales)}
          sub="Total comprometido (incl. separados)"
        />
        <KpiCard
          title="Cobrado real"
          value={fmt(report.totalCollected)}
          sub={`${collectionRate.toFixed(1)}% del volumen`}
          trend={collectionRate >= 90
            ? { label: 'Tasa de cobro alta', positive: true }
            : { label: `${(100 - collectionRate).toFixed(1)}% pendiente en separados`, positive: false }
          }
        />
        <KpiCard
          title="Órdenes"
          value={report.totalOrders.toLocaleString('es-MX')}
          sub={`Promedio ${fmt(report.averageOrderValue)}`}
        />
        <KpiCard
          title="Artículos vendidos"
          value={report.totalItemsSold.toLocaleString('es-MX')}
          sub={`${(report.totalItemsSold / report.totalOrders).toFixed(1)} por orden`}
        />
      </div>

      {/* Secondary KPIs */}
      {report.pendingLayawayBalance > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <KpiCard
            title="Saldo pendiente (separados)"
            value={fmt(report.pendingLayawayBalance)}
            sub={`${report.activeLayawayOrders} separado${report.activeLayawayOrders !== 1 ? 's' : ''} activo${report.activeLayawayOrders !== 1 ? 's' : ''}`}
            trend={{ label: 'Por cobrar', positive: false }}
          />
          <KpiCard
            title="Cobrado de separados"
            value={fmt(report.totalCollected - (report.totalSales - report.totalCollected - report.pendingLayawayBalance))}
            sub="Anticipos recibidos"
            trend={{ label: 'Entrada efectiva', positive: true }}
          />
        </div>
      )}

      {/* Client-side charts (area + pie + bar sellers) */}
      <ErrorBoundary>
        <ReportCharts report={report} />
      </ErrorBoundary>

      {/* Top products */}
      <Section title="Top 10 Productos" description="Productos más vendidos por unidades en el período">
        <ErrorBoundary>
          <TopProductsChart
            products={report.topSellingProducts}
            totalItemsSold={report.totalItemsSold}
          />
        </ErrorBoundary>
      </Section>

      {/* Layaway table */}
      <LayawayTable orders={report.layawayOrders} />
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────
function ReportSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <Skeleton className="h-80 rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}
