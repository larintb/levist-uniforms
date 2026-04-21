'use client';

import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, TooltipItem } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface TopProduct {
  product: string;
  quantity: number;
  total: number;
}

interface TopProductsChartProps {
  products: TopProduct[];
  totalItemsSold: number;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

const CHART_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6B7280',
];

export default function TopProductsChart({ products, totalItemsSold }: TopProductsChartProps) {
  const topProducts = products.slice(0, 10);

  if (!topProducts || topProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-3">📦</p>
        <p className="text-gray-500">Sin datos de productos en este período</p>
      </div>
    );
  }

  const borderColors = CHART_COLORS.slice(0, topProducts.length);
  const backgroundColors = borderColors.map(c => c + '99');

  const chartData = {
    labels: topProducts.map(p => p.product),
    datasets: [{
      data: topProducts.map(p => p.quantity),
      backgroundColor: backgroundColors,
      borderColor: borderColors,
      borderWidth: 2,
      hoverOffset: 16,
      hoverBorderWidth: 3,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(17,24,39,0.95)',
        titleColor: '#f9fafb',
        bodyColor: '#d1d5db',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: (item: TooltipItem<'doughnut'>) => {
            const p = topProducts[item.dataIndex];
            const pct = ((p.quantity / totalItemsSold) * 100).toFixed(1);
            const avg = p.total / p.quantity;
            return [
              `Participación: ${pct}%`,
              `Unidades vendidas: ${p.quantity.toLocaleString('es-MX')}`,
              `Ingreso total: ${formatCurrency(p.total)}`,
              `Precio promedio: ${formatCurrency(avg)}`,
            ];
          },
          labelColor: (item: TooltipItem<'doughnut'>) => ({
            borderColor: borderColors[item.dataIndex],
            backgroundColor: backgroundColors[item.dataIndex],
          }),
        },
      },
    },
    animation: { animateRotate: true, animateScale: true, duration: 800 },
    cutout: '62%',
  };

  const topTotal = topProducts.reduce((s, p) => s + p.quantity, 0);
  const topRevenue = topProducts.reduce((s, p) => s + p.total, 0);
  const topCoverage = ((topTotal / totalItemsSold) * 100).toFixed(1);

  return (
    <div className="space-y-6">

      {/* Gráfica dona */}
      <div className="relative h-80 w-full">
        <Doughnut data={chartData} options={options} />
      </div>

      {/* Barra de distribución */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Distribución por producto
        </p>
        <div className="w-full bg-gray-100 rounded-full h-7 overflow-hidden flex">
          {topProducts.map((product, i) => {
            const pct = (product.quantity / topTotal) * 100;
            const overallPct = (product.quantity / totalItemsSold) * 100;
            return (
              <div
                key={i}
                className="flex items-center justify-center text-xs font-semibold text-white relative group transition-all hover:brightness-110"
                style={{ width: `${pct}%`, backgroundColor: borderColors[i], minWidth: pct > 5 ? 'auto' : 0 }}
                title={`${product.product}: ${overallPct.toFixed(1)}%`}
              >
                {pct > 9 && `${overallPct.toFixed(0)}%`}
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap shadow-lg">
                  <p className="font-semibold">{product.product}</p>
                  <p>{overallPct.toFixed(1)}% del total</p>
                  <p>{product.quantity.toLocaleString('es-MX')} unidades</p>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-2">
        {topProducts.map((product, i) => {
          const pct = ((product.quantity / totalItemsSold) * 100).toFixed(1);
          return (
            <div key={i} className="flex items-center gap-1.5 text-sm text-gray-700">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: borderColors[i] }} />
              <span className="font-medium">{product.product}</span>
              <span className="text-gray-400">({pct}%)</span>
            </div>
          );
        })}
      </div>

      {/* Resumen numérico */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">{topProducts.length}</p>
          <p className="text-xs text-blue-600 font-medium mt-0.5">Productos mostrados</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{topTotal.toLocaleString('es-MX')}</p>
          <p className="text-xs text-green-600 font-medium mt-0.5">Unidades (top {topProducts.length})</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <p className="text-xl font-bold text-purple-700">{formatCurrency(topRevenue)}</p>
          <p className="text-xs text-purple-600 font-medium mt-0.5">Ingreso (top {topProducts.length})</p>
        </div>
      </div>
      <p className="text-xs text-gray-400 text-center -mt-2">
        Los top {topProducts.length} productos representan el {topCoverage}% de las unidades vendidas
      </p>

      {/* Tabla detallada */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Desglose detallado</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-gray-500 font-semibold uppercase text-xs">#</th>
                <th className="text-left py-2 px-3 text-gray-500 font-semibold uppercase text-xs">Producto</th>
                <th className="text-center py-2 px-3 text-gray-500 font-semibold uppercase text-xs">Unidades</th>
                <th className="text-center py-2 px-3 text-gray-500 font-semibold uppercase text-xs">Participación</th>
                <th className="text-right py-2 px-3 text-gray-500 font-semibold uppercase text-xs">Ingreso</th>
                <th className="text-right py-2 px-3 text-gray-500 font-semibold uppercase text-xs">Precio prom.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topProducts.map((product, i) => {
                const pct = ((product.quantity / totalItemsSold) * 100).toFixed(1);
                const avg = product.total / product.quantity;
                return (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: borderColors[i] }} />
                        <span className="font-semibold text-gray-500">#{i + 1}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-medium text-gray-900">{product.product}</td>
                    <td className="py-3 px-3 text-center text-gray-700">{product.quantity.toLocaleString('es-MX')}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: borderColors[i] }}
                          />
                        </div>
                        <span className="text-gray-600 font-medium w-10 text-right text-xs">{pct}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-gray-900">{formatCurrency(product.total)}</td>
                    <td className="py-3 px-3 text-right text-gray-500">{formatCurrency(avg)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
