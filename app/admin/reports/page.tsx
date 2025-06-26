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

// --- Reusable UI Components ---

// A styled card for displaying key metrics
const StatCard = ({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center space-x-4">
    <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full">
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  </div>
);

// --- Main Page Component ---

export default async function ReportsPage({
  searchParams,
}: {
  // Define the type for searchParams
  searchParams: Promise<{
    startDate?: string;
    endDate?: string;
  }>;
}) {
  // Await searchParams before using its properties
  const params = await searchParams;
  
  // Get dates from URL search parameters, with fallbacks to the current month
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];
  
  // Safely access searchParams with defaults
  const startDate = params.startDate || firstDayOfMonth;
  const endDate = params.endDate || todayStr;

  return (
    <div className="p-4 md:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-800 dark:text-gray-200">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financial Reports</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            An overview of your business's sales and financial performance.
          </p>
        </header>

        {/* Date Filter Form */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-8">
          <form method="GET" className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full">
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                defaultValue={startDate}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-gray-50 dark:bg-gray-700 p-2"
              />
            </div>
            <div className="w-full">
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                defaultValue={endDate}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-gray-50 dark:bg-gray-700 p-2"
              />
            </div>
            <div className="w-full sm:w-auto pt-5">
              <button
                type="submit"
                className="w-full justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Generate Report
              </button>
            </div>
          </form>
        </div>

        {/* Suspense boundary with a key to ensure it re-renders on date change */}
        <Suspense key={startDate + endDate} fallback={<ReportSkeleton />}>
          <ReportContent startDate={startDate} endDate={endDate} />
        </Suspense>
      </div>
    </div>
  );
}

// --- Data Display Component (fetches and renders data) ---
async function ReportContent({ startDate, endDate }: { startDate: string, endDate: string }) {
  // This is where the server action is called, inside an async component.
  const report = await getFinancialReport(startDate, endDate);

  // Placeholder Icons (replace with your icon library e.g., lucide-react)
  const DollarSignIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
  const ShoppingCartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>;
  const PackageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>;
  const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;

  return (
    <>
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Sales" value={formatCurrency(report.totalSales)} icon={<DollarSignIcon />} />
        <StatCard title="Total Orders" value={report.totalOrders} icon={<ShoppingCartIcon />} />
        <StatCard title="Items Sold" value={report.totalItemsSold} icon={<PackageIcon />} />
        <StatCard title="Avg. Order Value" value={formatCurrency(report.averageOrderValue)} icon={<UsersIcon />} />
      </div>

      {/* Data Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Sales by Payment Method</h2>
          <Table data={report.salesByPaymentMethod} columns={[
            { header: 'Method', accessor: 'method' },
            { header: 'Transactions', accessor: 'count' },
            { header: 'Total Value', accessor: 'total', format: formatCurrency },
          ]} />
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Sales by Seller</h2>
          <Table data={report.salesBySeller} columns={[
            { header: 'Seller', accessor: 'seller' },
            { header: 'Items Sold', accessor: 'count' },
            { header: 'Total Value', accessor: 'total', format: formatCurrency },
          ]} />
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Top 10 Selling Products</h2>
          <Table data={report.topSellingProducts} columns={[
            { header: 'Product', accessor: 'product' },
            { header: 'Quantity Sold', accessor: 'quantity' },
            { header: 'Total Revenue', accessor: 'total', format: formatCurrency },
          ]} />
        </div>
      </div>
    </>
  );
}

// A generic table component for reusability
const Table = ({ data, columns }: { data: any[], columns: { header: string, accessor: string, format?: (value: any) => string }[] }) => {
  if (!data || data.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400">No data available for this period.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            {columns.map(col => <th key={col.accessor} scope="col" className="px-6 py-3">{col.header}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
              {columns.map(col => (
                <td key={col.accessor} className="px-6 py-4">
                  {col.format ? col.format(row[col.accessor]) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// A skeleton loader to show while data is being fetched
const ReportSkeleton = () => (
  <div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
    </div>
  </div>
);