'use client';

import {
  Bar, BarChart, XAxis, YAxis, CartesianGrid, Cell,
  Tooltip,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';

interface TopProduct {
  product: string;
  sku: string;
  quantity: number;
  total: number;
}

interface Props {
  products: TopProduct[];
  totalItemsSold: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

const COLORS = [
  'hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))',
  'hsl(var(--chart-4))', 'hsl(var(--chart-5))',
  'hsl(220 70% 60%)', 'hsl(160 60% 50%)', 'hsl(30 80% 55%)', 'hsl(280 65% 60%)', 'hsl(340 75% 55%)',
];

const chartConfig: ChartConfig = {
  quantity: { label: 'Unidades' },
  total: { label: 'Ingreso' },
};

export default function TopProductsChart({ products, totalItemsSold }: Props) {
  const top = products.slice(0, 10);
  if (!top.length) return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <span className="text-4xl mb-3">📦</span>
      <p className="text-sm">Sin datos de productos en este período</p>
    </div>
  );

  const data = top.map((p, i) => ({
    name: p.sku || p.product,
    fullName: p.product,
    sku: p.sku,
    quantity: p.quantity,
    total: p.total,
    pct: totalItemsSold > 0 ? (p.quantity / totalItemsSold) * 100 : 0,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <div className="space-y-6">
      {/* Horizontal bar chart — unidades */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Unidades vendidas
        </p>
        <ChartContainer config={chartConfig} className="h-72 w-full">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 60, left: 8, bottom: 0 }}
          >
            <CartesianGrid horizontal={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="quantity"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v.toLocaleString('es-MX')}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={140}
              tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name, props) => {
                    const d = props.payload;
                    return [
                      <span key="val" className="font-mono font-semibold">{Number(value).toLocaleString('es-MX')} uds · {fmt(d.total)}</span>,
                      <span key="pct" className="text-muted-foreground">{d.pct.toFixed(1)}% del total</span>,
                    ];
                  }}
                  labelFormatter={(_, payload) => {
                    const d = payload?.[0]?.payload;
                    return d ? `${d.sku} — ${d.fullName}` : '';
                  }}
                />
              }
            />
            <Bar dataKey="quantity" radius={[0, 4, 4, 0]} maxBarSize={24}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>

      {/* Tabla detallada */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Detalle</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['#', 'SKU', 'Unids.', 'Participación', 'Ingreso', 'Precio prom.'].map(h => (
                <th key={h} className="text-left py-2 px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide first:w-8">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((p, i) => (
              <tr key={i} className="hover:bg-accent/50 transition-colors">
                <td className="py-2 px-2">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="text-xs font-semibold text-muted-foreground">{i + 1}</span>
                  </span>
                </td>
                <td className="py-2 px-2 max-w-48" title={p.fullName}>
                  <p className="font-mono font-semibold text-foreground text-xs">{p.sku}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{p.fullName}</p>
                </td>
                <td className="py-2 px-2 font-mono tabular-nums text-foreground">{p.quantity.toLocaleString('es-MX')}</td>
                <td className="py-2 px-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-1.5 min-w-16">
                      <div className="h-1.5 rounded-full" style={{ width: `${Math.min(p.pct, 100)}%`, backgroundColor: p.color }} />
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums w-9 text-right">{p.pct.toFixed(1)}%</span>
                  </div>
                </td>
                <td className="py-2 px-2 text-right font-semibold font-mono tabular-nums">{fmt(p.total)}</td>
                <td className="py-2 px-2 text-right text-muted-foreground font-mono tabular-nums">{fmt(p.total / p.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
