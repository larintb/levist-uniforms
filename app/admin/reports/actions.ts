// app/admin/reports/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { unstable_noStore as noStore } from 'next/cache';
import { cookies } from 'next/headers';

// Helper function to determine if a date is in Daylight Saving Time for Chicago
function isDaylightSavingTime(date: Date): boolean {
  // DST in US: Second Sunday in March to First Sunday in November
  const year = date.getFullYear();
  
  // Second Sunday in March
  const marchSecondSunday = new Date(year, 2, 1); // March 1st
  marchSecondSunday.setDate(marchSecondSunday.getDate() + (7 - marchSecondSunday.getDay()) % 7 + 7);
  
  // First Sunday in November  
  const novemberFirstSunday = new Date(year, 10, 1); // November 1st
  novemberFirstSunday.setDate(novemberFirstSunday.getDate() + (7 - novemberFirstSunday.getDay()) % 7);
  
  return date >= marchSecondSunday && date < novemberFirstSunday;
}

// Define the structure of our order data
interface OrderDetail {
  order_id: number;
  order_total: number;
  quantity: number;
  payment_method: string | null;
  seller_name: string | null;
  product_name: string | null;
  price_at_sale: number;
  order_date: string;
  // Remove the any index signature and define specific fields if needed
  // If you have other known fields, add them here explicitly
  // [key: string]: any; // Remove this line
}

// Define the structure of our report data
export interface FinancialReport {
  totalSales: number;
  totalOrders: number;
  totalItemsSold: number;
  averageOrderValue: number;
  salesByPaymentMethod: { method: string; total: number; count: number }[];
  salesBySeller: { seller: string; total: number; count: number }[];
  topSellingProducts: { product: string; quantity: number; total: number }[];
  rawOrders: OrderDetail[];
}

/**
 * Fetches and processes financial data from the 'full_order_details' view
 * to generate a comprehensive sales and finance report.
 * @param {string | null} startDate - The start date for the report period (YYYY-MM-DD).
 * @param {string | null} endDate - The end date for the report period (YYYY-MM-DD).
 * @returns {Promise<FinancialReport>} - The generated financial report.
 */
export async function getFinancialReport(
  startDate: string | null,
  endDate: string | null
): Promise<FinancialReport> {
  // Prevents caching of this data, ensuring reports are always fresh
  noStore();
  
  try {
    // Await cookies before creating the Supabase client
    await cookies();
    const supabase = await createClient();

    // Base query from the detailed order view
    let query = supabase.from('full_order_details').select('*');

    // Apply date filters if provided - Converting from Chicago timezone to UTC
    if (startDate) {
      // Create date at start of day in Chicago timezone
      const startInChicago = new Date(`${startDate}T00:00:00`);
      const isDST = isDaylightSavingTime(startInChicago);
      
      // Convert to UTC by adding the appropriate offset
      // CDT (Daylight) = UTC-5, CST (Standard) = UTC-6
      const hoursOffset = isDST ? 5 : 6;
      const startUTC = new Date(startInChicago.getTime() + (hoursOffset * 3600000));
      
      query = query.gte('order_date', startUTC.toISOString());
    }
    if (endDate) {
      // Create date at end of day in Chicago timezone
      const endInChicago = new Date(`${endDate}T23:59:59`);
      const isDST = isDaylightSavingTime(endInChicago);
      
      // Convert to UTC by adding the appropriate offset
      const hoursOffset = isDST ? 5 : 6;
      const endUTC = new Date(endInChicago.getTime() + (hoursOffset * 3600000));
      
      query = query.lte('order_date', endUTC.toISOString());
    }
    
    // Execute the query
    const { data: orders, error } = await query;

    if (error) {
      console.error('Supabase query error:', error.message);
      throw new Error('Failed to fetch order details for the report.');
    }

    if (!orders || orders.length === 0) {
      // Return a default empty report if no data is found
      return {
        totalSales: 0,
        totalOrders: 0,
        totalItemsSold: 0,
        averageOrderValue: 0,
        salesByPaymentMethod: [],
        salesBySeller: [],
        topSellingProducts: [],
        rawOrders: [],
      };
    }
    
    // --- Data Processing and Metric Calculation ---

    // Use maps for efficient aggregation
    const salesByPaymentMethod = new Map<string, { total: number; count: number }>();
    const salesBySeller = new Map<string, { total: number; count: number }>();
    const topSellingProducts = new Map<string, { quantity: number; total: number }>();
    const uniqueOrderIds = new Set<number>();
    
    let totalSales = 0;
    let totalItemsSold = 0;

    orders.forEach((item: OrderDetail) => {
      // Aggregate total sales and unique orders
      if (!uniqueOrderIds.has(item.order_id)) {
        uniqueOrderIds.add(item.order_id);
        totalSales += item.order_total;
      }

      totalItemsSold += item.quantity;

      // Aggregate sales by payment method
      const paymentMethod = item.payment_method || 'N/A';
      const currentPayment = salesByPaymentMethod.get(paymentMethod) || { total: 0, count: 0 };
      salesByPaymentMethod.set(paymentMethod, {
        total: currentPayment.total + item.price_at_sale * item.quantity,
        count: currentPayment.count + 1,
      });
      
      // Aggregate sales by seller
      const sellerName = item.seller_name || 'N/A';
      const currentSeller = salesBySeller.get(sellerName) || { total: 0, count: 0 };
      // This assumes one seller per order. We sum up item totals for the seller.
      // A more precise approach might group by order first.
      // For simplicity here, we add the item value.
      salesBySeller.set(sellerName, {
          total: currentSeller.total + (item.price_at_sale * item.quantity),
          count: currentSeller.count + 1 // This will count items per seller
      });

      // Aggregate top selling products
      const productName = item.product_name || 'N/A';
      const currentProduct = topSellingProducts.get(productName) || { quantity: 0, total: 0 };
      topSellingProducts.set(productName, {
        quantity: currentProduct.quantity + item.quantity,
        total: currentProduct.total + item.price_at_sale * item.quantity,
      });
    });
    
    const totalOrders = uniqueOrderIds.size;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    
    // Convert maps to arrays for the final report
    const formattedSalesByPaymentMethod = Array.from(salesByPaymentMethod.entries()).map(([method, data]) => ({ method, ...data }));
    const formattedSalesBySeller = Array.from(salesBySeller.entries()).map(([seller, data]) => ({ seller, ...data }));
    const formattedTopSellingProducts = Array.from(topSellingProducts.entries())
      .map(([product, data]) => ({ product, ...data }))
      .sort((a, b) => b.quantity - a.quantity) // Sort by quantity sold
      .slice(0, 10); // Get top 10

    return {
      totalSales,
      totalOrders,
      totalItemsSold,
      averageOrderValue,
      salesByPaymentMethod: formattedSalesByPaymentMethod,
      salesBySeller: formattedSalesBySeller,
      topSellingProducts: formattedTopSellingProducts,
      rawOrders: orders as OrderDetail[],
    };

  } catch (error) {
    console.error('Error generating financial report:', error);
    
    // Return empty report on error to prevent the app from crashing
    return {
      totalSales: 0,
      totalOrders: 0,
      totalItemsSold: 0,
      averageOrderValue: 0,
      salesByPaymentMethod: [],
      salesBySeller: [],
      topSellingProducts: [],
      rawOrders: [],
    };
  }
}