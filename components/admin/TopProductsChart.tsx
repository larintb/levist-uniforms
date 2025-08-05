'use client';

import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  TooltipItem,
} from 'chart.js';

// Register the required Chart.js components
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

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Generate distinct colors for the chart
const generateColors = (count: number) => {
  const colors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#84CC16', // Lime
    '#EC4899', // Pink
    '#6B7280', // Gray
  ];
  
  // If we need more colors than predefined, generate them
  while (colors.length < count) {
    const hue = (colors.length * 137.508) % 360; // Golden angle approximation
    colors.push(`hsl(${hue}, 70%, 50%)`);
  }
  
  return colors.slice(0, count);
};

export default function TopProductsChart({ products, totalItemsSold }: TopProductsChartProps) {
  // Limit to top 10 products for better visualization
  const topProducts = products.slice(0, 10);
  
  if (!topProducts || topProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 dark:text-gray-500 text-4xl mb-4">📊</div>
        <p className="text-gray-500 dark:text-gray-400">No product data available</p>
      </div>
    );
  }

  const colors = generateColors(topProducts.length);
  const backgroundColors = colors.map(color => color + '80'); // Add transparency
  const borderColors = colors;

  const data = {
    labels: topProducts.map(product => product.product),
    datasets: [
      {
        data: topProducts.map(product => product.quantity),
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 2,
        hoverOffset: 20, // This creates the "pop out" effect on hover
        hoverBorderWidth: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hide the legend completely
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        padding: 12,
        callbacks: {
          title: (tooltipItems: TooltipItem<'doughnut'>[]) => {
            return tooltipItems[0].label;
          },
          label: (tooltipItem: TooltipItem<'doughnut'>) => {
            const index = tooltipItem.dataIndex;
            const product = topProducts[index];
            const percentage = ((product.quantity / totalItemsSold) * 100).toFixed(1);
            const avgPrice = product.total / product.quantity;
            
            return [
              `Market Share: ${percentage}%`,
              `Units Sold: ${product.quantity.toLocaleString()}`,
              `Total Revenue: ${formatCurrency(product.total)}`,
              `Avg. Price: ${formatCurrency(avgPrice)}`,
            ];
          },
          labelColor: (tooltipItem: TooltipItem<'doughnut'>) => {
            const index = tooltipItem.dataIndex;
            return {
              borderColor: borderColors[index],
              backgroundColor: backgroundColors[index],
            };
          },
        },
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000,
    },
    interaction: {
      intersect: false,
    },
    cutout: '60%', // Creates the doughnut effect
  };

  return (
    <div className="space-y-6">
      <style jsx>{`
        .text-shadow-sm {
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
      `}</style>
      {/* Chart Container */}
      <div className="relative h-96 w-full">
        <Doughnut data={data} options={options} />
      </div>

      {/* Percentage Bar Visualization */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-white dark:text-white mb-3">Market Share Distribution</h4>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-8 overflow-hidden shadow-inner">
          <div className="flex h-full">
            {topProducts.map((product, index) => {
              // Calculate percentage based on top products total, not overall total
              const topProductsTotal = topProducts.reduce((sum, p) => sum + p.quantity, 0);
              const percentage = (product.quantity / topProductsTotal) * 100;
              const overallPercentage = (product.quantity / totalItemsSold) * 100;
              
              return (
                <div
                  key={index}
                  className="flex items-center justify-center text-xs font-medium text-white relative group transition-all duration-300 hover:brightness-110"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: borderColors[index],
                    minWidth: percentage > 5 ? 'auto' : '0px' // Only show text if segment is large enough
                  }}
                  title={`${product.product}: ${overallPercentage.toFixed(1)}% of total sales`}
                >
                  {percentage > 8 && (
                    <span className="text-shadow-sm">
                      {overallPercentage.toFixed(1)}%
                    </span>
                  )}
                  
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                    <div className="font-medium">{product.product}</div>
                    <div>Market Share: {overallPercentage.toFixed(1)}%</div>
                    <div>Share of Top Products: {percentage.toFixed(1)}%</div>
                    <div>Units: {product.quantity.toLocaleString()}</div>
                    <div>Revenue: {formatCurrency(product.total)}</div>
                    {/* Arrow pointing down */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Legend for the bar */}
        <div className="mt-4 flex flex-wrap gap-3 justify-center">
          {topProducts.map((product, index) => {
            const percentage = ((product.quantity / totalItemsSold) * 100).toFixed(1);
            return (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: borderColors[index] }}
                ></div>
                <span className="text-white dark:text-white font-medium">
                  {product.product}
                </span>
                <span className="text-gray-200 dark:text-gray-200">
                  ({percentage}%)
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Show coverage info */}
        <div className="mt-2 text-center">
          <span className="text-xs text-gray-200 dark:text-gray-200">
            Top {topProducts.length} products represent {((topProducts.reduce((sum, p) => sum + p.quantity, 0) / totalItemsSold) * 100).toFixed(1)}% of total sales
          </span>
        </div>
      </div>
      
      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {topProducts.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Top Products Shown</div>
        </div>
        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {topProducts.reduce((sum, product) => sum + product.quantity, 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Units (Top Products)</div>
        </div>
        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {formatCurrency(topProducts.reduce((sum, product) => sum + product.total, 0))}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Revenue (Top Products)</div>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="mt-8">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Detailed Breakdown
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">
                  Rank
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">
                  Product
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">
                  Units Sold
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">
                  Market Share
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">
                  Total Revenue
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">
                  Avg. Price
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {topProducts.map((product, index) => {
                const percentage = ((product.quantity / totalItemsSold) * 100).toFixed(1);
                const avgPrice = product.total / product.quantity;
                
                return (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                    <td className="py-4 px-4 text-sm">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded-full mr-3"
                          style={{ backgroundColor: borderColors[index] }}
                        ></div>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          #{index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900 dark:text-gray-100 font-medium">
                      {product.product}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900 dark:text-gray-100">
                      {product.quantity.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-sm">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                          <div 
                            className="h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: borderColors[index]
                            }}
                          ></div>
                        </div>
                        <span className="text-gray-900 dark:text-gray-100 font-medium">
                          {percentage}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900 dark:text-gray-100 font-medium">
                      {formatCurrency(product.total)}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900 dark:text-gray-100">
                      {formatCurrency(avgPrice)}
                    </td>
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
