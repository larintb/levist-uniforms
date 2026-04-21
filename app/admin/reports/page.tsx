// app/admin/reports/page.tsx
import { getFinancialReport, type LayawayOrderSummary } from './actions';
import { Suspense } from 'react';
import TopProductsChart from '@/components/admin/TopProductsChart';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

// --- Componentes UI ---

const StatCard = ({
  title,
  value,
  subtitle,
  accent = 'blue',
  icon,
}: {
  title: string;
  value: string;
  subtitle?: string;
  accent?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  icon: React.ReactNode;
}) => {
  const colors = {
    blue:   'from-blue-500 to-blue-600',
    green:  'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    red:    'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
  };
  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 p-6 flex items-center gap-4">
      <div className={`bg-gradient-to-br ${colors[accent]} p-3 rounded-lg shadow shrink-0`}>
        <div className="text-white w-6 h-6">{icon}</div>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-gray-900 truncate">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
};

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
      <h3 className="text-base font-semibold text-gray-800">{title}</h3>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

// --- Íconos ---
const IconMoney = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
);
const IconCash = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75" />
  </svg>
);
const IconCart = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
  </svg>
);
const IconLayaway = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);
const LayawayTable = ({ orders }: { orders: LayawayOrderSummary[] }) => {
  if (orders.length === 0) return null;
  return (
    <SectionCard title={`🏦 Separados con saldo pendiente (${orders.length})`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 text-gray-500 font-semibold uppercase text-xs">Orden</th>
              <th className="text-left py-2 px-3 text-gray-500 font-semibold uppercase text-xs">Cliente</th>
              <th className="text-left py-2 px-3 text-gray-500 font-semibold uppercase text-xs">Fecha</th>
              <th className="text-right py-2 px-3 text-gray-500 font-semibold uppercase text-xs">Total</th>
              <th className="text-right py-2 px-3 text-gray-500 font-semibold uppercase text-xs">Anticipo</th>
              <th className="text-right py-2 px-3 text-gray-500 font-semibold uppercase text-xs">Saldo</th>
              <th className="py-2 px-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-amber-50 transition-colors">
                <td className="py-3 px-3 font-mono text-xs text-gray-500">
                  #{o.id.slice(0, 8).toUpperCase()}
                </td>
                <td className="py-3 px-3 font-medium text-gray-900">{o.customer_name}</td>
                <td className="py-3 px-3 text-gray-500">
                  {new Date(o.created_at).toLocaleDateString('es-MX', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </td>
                <td className="py-3 px-3 text-right text-gray-700">{formatCurrency(o.order_total)}</td>
                <td className="py-3 px-3 text-right text-green-700 font-medium">{formatCurrency(o.down_payment)}</td>
                <td className="py-3 px-3 text-right">
                  <span className="inline-block bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded">
                    {formatCurrency(o.remaining_balance)}
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  <a
                    href={`/admin/orders/${o.id}/manage`}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    Ver →
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200 bg-gray-50">
              <td colSpan={5} className="py-3 px-3 font-bold text-gray-700 text-right">Total saldo pendiente</td>
              <td className="py-3 px-3 text-right">
                <span className="inline-block bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded text-base">
                  {formatCurrency(orders.reduce((s, o) => s + o.remaining_balance, 0))}
                </span>
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </SectionCard>
  );
};

// --- Página principal ---
export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
}) {
  const params = await searchParams;
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split('T')[0];
  const todayStr = today.toISOString().split('T')[0];

  const startDate = params.startDate || firstDayOfMonth;
  const endDate = params.endDate || todayStr;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes de Ventas</h1>
          <p className="text-gray-500 mt-1">Resumen financiero del período seleccionado</p>
        </div>

        {/* Filtro de fechas */}
        <SectionCard title="Período del reporte">
          <form method="GET" className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
              <input
                type="date"
                name="startDate"
                defaultValue={startDate}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
              <input
                type="date"
                name="endDate"
                defaultValue={endDate}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Generar reporte
            </button>
          </form>
        </SectionCard>

        <Suspense key={startDate + endDate} fallback={<ReportSkeleton />}>
          <ReportContent startDate={startDate} endDate={endDate} />
        </Suspense>
      </div>
    </div>
  );
}

// --- Contenido del reporte ---
async function ReportContent({ startDate, endDate }: { startDate: string; endDate: string }) {
  const report = await getFinancialReport(startDate, endDate);

  if (report.totalOrders === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-4xl mb-3">📊</p>
        <p className="text-lg font-medium">Sin ventas en este período</p>
      </div>
    );
  }

  const uncollected = report.totalSales - report.totalCollected;

  return (
    <div className="space-y-8">

      {/* Bloque principal: volumen vs cobrado */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Resumen financiero
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Volumen de ventas"
            value={formatCurrency(report.totalSales)}
            subtitle="Total comprometido (incl. separados)"
            accent="blue"
            icon={<IconMoney />}
          />
          <StatCard
            title="Cobrado real"
            value={formatCurrency(report.totalCollected)}
            subtitle="Dinero que realmente entró"
            accent="green"
            icon={<IconCash />}
          />
          <StatCard
            title="Órdenes"
            value={report.totalOrders.toLocaleString('es-MX')}
            subtitle={`Promedio ${formatCurrency(report.averageOrderValue)}`}
            accent="purple"
            icon={<IconCart />}
          />
          <StatCard
            title="Por cobrar (separados)"
            value={formatCurrency(report.pendingLayawayBalance)}
            subtitle={`${report.activeLayawayOrders} separado${report.activeLayawayOrders !== 1 ? 's' : ''} con saldo`}
            accent={report.pendingLayawayBalance > 0 ? 'yellow' : 'green'}
            icon={<IconLayaway />}
          />
        </div>
      </div>

      {/* Barra de conciliación */}
      {uncollected > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <p className="text-sm font-semibold text-amber-800 mb-3">
            Conciliación del período
          </p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-amber-600 font-medium">Volumen vendido</p>
              <p className="text-xl font-bold text-amber-900">{formatCurrency(report.totalSales)}</p>
            </div>
            <div>
              <p className="text-xs text-amber-600 font-medium">Cobrado</p>
              <p className="text-xl font-bold text-green-700">{formatCurrency(report.totalCollected)}</p>
            </div>
            <div>
              <p className="text-xs text-amber-600 font-medium">Pendiente separados</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(uncollected)}</p>
            </div>
          </div>
          <div className="mt-3 h-2 bg-amber-200 rounded-full overflow-hidden">
            <div
              className="h-2 bg-green-500 rounded-full transition-all"
              style={{ width: `${Math.min((report.totalCollected / report.totalSales) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-amber-600 mt-1 text-right">
            {((report.totalCollected / report.totalSales) * 100).toFixed(1)}% cobrado
          </p>
        </div>
      )}

      {/* Separados con saldo pendiente */}
      <LayawayTable orders={report.layawayOrders} />

      {/* Desglose por método de pago */}
      <SectionCard title="Cobrado por método de pago">
        {report.collectedByPaymentMethod.length === 0 ? (
          <p className="text-gray-400 text-center py-6">Sin datos</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-gray-500 font-semibold uppercase text-xs">Método</th>
                  <th className="text-center py-2 px-3 text-gray-500 font-semibold uppercase text-xs">Órdenes</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-semibold uppercase text-xs">Cobrado</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-semibold uppercase text-xs">% del total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {report.collectedByPaymentMethod.map((row) => (
                  <tr key={row.method} className="hover:bg-gray-50">
                    <td className="py-3 px-3 font-medium text-gray-900">{row.method}</td>
                    <td className="py-3 px-3 text-center text-gray-600">{row.count}</td>
                    <td className="py-3 px-3 text-right font-bold text-gray-900">{formatCurrency(row.collected)}</td>
                    <td className="py-3 px-3 text-right text-gray-500">
                      {report.totalCollected > 0
                        ? `${((row.collected / report.totalCollected) * 100).toFixed(1)}%`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 bg-gray-50">
                  <td className="py-3 px-3 font-bold text-gray-900">Total</td>
                  <td className="py-3 px-3 text-center font-bold text-gray-900">{report.totalOrders}</td>
                  <td className="py-3 px-3 text-right font-bold text-green-700 text-base">{formatCurrency(report.totalCollected)}</td>
                  <td className="py-3 px-3 text-right font-bold text-gray-900">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Desempeño por vendedor */}
      <SectionCard title="Desempeño por vendedor">
        {report.salesBySeller.length === 0 ? (
          <p className="text-gray-400 text-center py-6">Sin datos</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-gray-500 font-semibold uppercase text-xs">Vendedor</th>
                  <th className="text-center py-2 px-3 text-gray-500 font-semibold uppercase text-xs">Órdenes</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-semibold uppercase text-xs">Volumen</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-semibold uppercase text-xs">Promedio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {report.salesBySeller.map((row) => (
                  <tr key={row.seller} className="hover:bg-gray-50">
                    <td className="py-3 px-3 font-medium text-gray-900">{row.seller}</td>
                    <td className="py-3 px-3 text-center text-gray-600">{row.count}</td>
                    <td className="py-3 px-3 text-right font-bold text-gray-900">{formatCurrency(row.total)}</td>
                    <td className="py-3 px-3 text-right text-gray-500">
                      {row.count > 0 ? formatCurrency(row.total / row.count) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Top productos */}
      <SectionCard title="Productos más vendidos">
        <TopProductsChart
          products={report.topSellingProducts}
          totalItemsSold={report.totalItemsSold}
        />
      </SectionCard>

    </div>
  );
}

const ReportSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-28 bg-gray-200 rounded-xl" />
      ))}
    </div>
    <div className="h-48 bg-gray-200 rounded-xl" />
    <div className="h-64 bg-gray-200 rounded-xl" />
  </div>
);
