// app/admin/reports/page.tsx
import { getFinancialReport } from './actions';
import { Suspense } from 'react';

// A helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// A helper function to format dates
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// --- Modern UI Components ---

// Enhanced stat card with trend indicators
const ModernStatCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  subtitle 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
}) => (
  <div className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">{title}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
        )}
      </div>
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-lg shadow-lg">
        <div className="text-white">
          {icon}
        </div>
      </div>
    </div>
    {trend && (
      <div className="absolute top-4 right-4">
        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          trend === 'up' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
          trend === 'down' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
          'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
        }`}>
          {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
        </div>
      </div>
    )}
  </div>
);

// Modern data card for sections
const DataCard = ({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
    </div>
    <div className="p-6">
      {children}
    </div>
  </div>
);

// Modern table component
const ModernTable = ({ data, columns, emptyMessage = "No data available" }: {
  data: Record<string, string | number>[];
  columns: { header: string; accessor: string; formatter?: (value: string | number, row?: Record<string, string | number>) => string }[];
  emptyMessage?: string;
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 dark:text-gray-500 text-4xl mb-4">📊</div>
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {columns.map((col, index) => (
              <th key={index} className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wider">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
              {columns.map((col, colIndex) => (
                <td key={colIndex} className="py-4 px-4 text-sm text-gray-900 dark:text-gray-100">
                  {col.formatter ? col.formatter(row[col.accessor], row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// --- Main Page Component ---
export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    startDate?: string;
    endDate?: string;
  }>;
}) {
  const params = await searchParams;
  
  // Get dates with better defaults
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];

  const startDate = params.startDate || firstDayOfMonth;
  const endDate = params.endDate || todayStr;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Financial Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
                Comprehensive insights into your business performance
              </p>
            </div>
            <div className="mt-4 lg:mt-0">
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <span>📅</span>
                <span>Report Period: {formatDate(startDate + 'T00:00:00')} - {formatDate(endDate + 'T23:59:59')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Date Filter Section */}
        <div className="mb-8">
          <DataCard title="📊 Report Filters" className="max-w-4xl">
            <form method="GET" className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  defaultValue={startDate}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  defaultValue={endDate}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  🔄 Generate Report
                </button>
              </div>
            </form>
          </DataCard>
        </div>

        {/* Report Content */}
        <Suspense key={startDate + endDate} fallback={<ModernReportSkeleton />}>
          <ModernReportContent startDate={startDate} endDate={endDate} />
        </Suspense>
      </div>
    </div>
  );
}

// --- Enhanced Report Content Component ---
async function ModernReportContent({ startDate, endDate }: { startDate: string, endDate: string }) {
  const report = await getFinancialReport(startDate, endDate);

  // Enhanced Icons
  const DollarIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
    </svg>
  );

  const CartIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0L17 13" />
    </svg>
  );

  const PackageIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );

  const TrendIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );

  return (
    <div className="space-y-8">
      
      {/* Key Metrics Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">📈 Key Performance Indicators</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ModernStatCard 
            title="Total Revenue" 
            value={formatCurrency(report.totalSales)} 
            icon={<DollarIcon />}
            trend="up"
            subtitle="Gross sales revenue"
          />
          <ModernStatCard 
            title="Orders Processed" 
            value={report.totalOrders.toLocaleString()} 
            icon={<CartIcon />}
            trend="neutral"
            subtitle="Total completed orders"
          />
          <ModernStatCard 
            title="Items Sold" 
            value={report.totalItemsSold.toLocaleString()} 
            icon={<PackageIcon />}
            trend="up"
            subtitle="Total units moved"
          />
          <ModernStatCard 
            title="Average Order Value" 
            value={formatCurrency(report.averageOrderValue)} 
            icon={<TrendIcon />}
            trend="neutral"
            subtitle="Revenue per order"
          />
        </div>
      </div>

      {/* Data Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Payment Methods */}
        <DataCard title="💳 Payment Method Analysis">
          <ModernTable 
            data={report.salesByPaymentMethod}
            columns={[
              { header: "Method", accessor: "method" },
              { header: "Transactions", accessor: "count", formatter: (val) => (val as number).toLocaleString() },
              { header: "Total Value", accessor: "total", formatter: (val) => formatCurrency(val as number) },
              { 
                header: "Avg. Transaction", 
                accessor: "total", 
                formatter: (val, row) => formatCurrency((val as number) / (row?.count as number)) 
              }
            ]}
            emptyMessage="No payment data available for this period"
          />
        </DataCard>

        {/* Seller Performance */}
        <DataCard title="👥 Seller Performance">
          <ModernTable 
            data={report.salesBySeller}
            columns={[
              { header: "Seller", accessor: "seller" },
              { header: "Items Sold", accessor: "count", formatter: (val) => (val as number).toLocaleString() },
              { header: "Total Revenue", accessor: "total", formatter: (val) => formatCurrency(val as number) },
              { 
                header: "Avg. per Item", 
                accessor: "total", 
                formatter: (val, row) => formatCurrency((val as number) / (row?.count as number)) 
              }
            ]}
            emptyMessage="No seller data available for this period"
          />
        </DataCard>
      </div>

      {/* Top Products - Full Width */}
      <DataCard title="🏆 Top Selling Products" className="col-span-full">
        <ModernTable 
          data={report.topSellingProducts}
          columns={[
            { header: "Product Name", accessor: "product" },
            { header: "Units Sold", accessor: "quantity", formatter: (val) => (val as number).toLocaleString() },
            { header: "Total Revenue", accessor: "total", formatter: (val) => formatCurrency(val as number) },
            { 
              header: "Avg. Price", 
              accessor: "total", 
              formatter: (val, row) => formatCurrency((val as number) / (row?.quantity as number)) 
            },
            { 
              header: "Market Share", 
              accessor: "quantity", 
              formatter: (val) => `${(((val as number) / report.totalItemsSold) * 100).toFixed(1)}%` 
            }
          ]}
          emptyMessage="No product sales data available for this period"
        />
      </DataCard>

      {/* Summary Insights */}
      {report.totalOrders > 0 && (
        <DataCard title="💡 Key Insights">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {report.salesByPaymentMethod.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Payment Methods Used</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {report.salesBySeller.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active Sellers</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {report.topSellingProducts.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Product Varieties</div>
            </div>
          </div>
        </DataCard>
      )}
    </div>
  );
}

// Enhanced loading skeleton
const ModernReportSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    {/* Stats skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-xl"></div>
      ))}
    </div>
    
    {/* Tables skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="h-80 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-xl"></div>
      ))}
    </div>
    
    {/* Full width table skeleton */}
    <div className="h-96 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-xl"></div>
  </div>
);
