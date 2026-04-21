// app/admin/reports/actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { unstable_noStore as noStore } from 'next/cache';
import { cookies } from 'next/headers';

function isDaylightSavingTime(date: Date): boolean {
  const year = date.getFullYear();
  const marchSecondSunday = new Date(year, 2, 1);
  marchSecondSunday.setDate(marchSecondSunday.getDate() + (7 - marchSecondSunday.getDay()) % 7 + 7);
  const novemberFirstSunday = new Date(year, 10, 1);
  novemberFirstSunday.setDate(novemberFirstSunday.getDate() + (7 - novemberFirstSunday.getDay()) % 7);
  return date >= marchSecondSunday && date < novemberFirstSunday;
}

function toUTC(dateStr: string, endOfDay: boolean): string {
  const time = endOfDay ? 'T23:59:59' : 'T00:00:00';
  const local = new Date(`${dateStr}${time}`);
  const offset = isDaylightSavingTime(local) ? 5 : 6;
  return new Date(local.getTime() + offset * 3600000).toISOString();
}

interface OrderRow {
  id: string;
  total: number;
  down_payment: number | null;
  remaining_balance: number | null;
  is_layaway: boolean | null;
  payment_method: string | null;
  status: string | null;
  customer_name: string | null;
  created_at: string;
}

export interface LayawayOrderSummary {
  id: string;
  customer_name: string;
  order_total: number;
  down_payment: number;
  remaining_balance: number;
  created_at: string;
}

interface ItemRow {
  order_id: string;
  quantity: number;
  price_at_sale: number;
  product_name: string | null;
  seller_name: string | null;
}

export interface FinancialReport {
  // Volumen y cobrado
  totalSales: number;
  totalCollected: number;
  totalOrders: number;
  totalItemsSold: number;
  averageOrderValue: number;
  // Separados
  pendingLayawayBalance: number;
  activeLayawayOrders: number;
  // Desgloses (usan cobrado real)
  collectedByPaymentMethod: { method: string; collected: number; count: number }[];
  salesBySeller: { seller: string; total: number; count: number }[];
  topSellingProducts: { product: string; quantity: number; total: number }[];
  layawayOrders: LayawayOrderSummary[];
}

export async function getFinancialReport(
  startDate: string | null,
  endDate: string | null
): Promise<FinancialReport> {
  noStore();
  await cookies();
  const supabase = await createClient();

  const empty: FinancialReport = {
    totalSales: 0,
    totalCollected: 0,
    totalOrders: 0,
    totalItemsSold: 0,
    averageOrderValue: 0,
    pendingLayawayBalance: 0,
    activeLayawayOrders: 0,
    collectedByPaymentMethod: [],
    salesBySeller: [],
    topSellingProducts: [],
    layawayOrders: [],
  };

  try {
    // --- Query 1: order-level financials ---
    let ordersQuery = supabase
      .from('orders')
      .select('id, total, down_payment, remaining_balance, is_layaway, payment_method, status, customer_name, created_at')
      .neq('status', 'cancelled');

    if (startDate) ordersQuery = ordersQuery.gte('created_at', toUTC(startDate, false));
    if (endDate)   ordersQuery = ordersQuery.lte('created_at', toUTC(endDate, true));

    const { data: ordersData, error: ordersError } = await ordersQuery;

    if (ordersError) {
      console.error('Error fetching orders:', ordersError.message);
      return empty;
    }
    if (!ordersData || ordersData.length === 0) return empty;

    // --- Query 2: item-level for products and sellers ---
    let itemsQuery = supabase
      .from('full_order_details')
      .select('order_id, quantity, price_at_sale, product_name, seller_name');

    if (startDate) itemsQuery = itemsQuery.gte('order_date', toUTC(startDate, false));
    if (endDate)   itemsQuery = itemsQuery.lte('order_date', toUTC(endDate, true));

    const { data: itemsData } = await itemsQuery;

    // --- Aggregate order-level metrics ---
    let totalSales = 0;
    let totalCollected = 0;
    let pendingLayawayBalance = 0;
    let activeLayawayOrders = 0;
    const byPaymentMethod = new Map<string, { collected: number; count: number }>();
    const layawayOrders: LayawayOrderSummary[] = [];

    (ordersData as OrderRow[]).forEach((order) => {
      const orderTotal = Number(order.total) || 0;
      const remaining = Number(order.remaining_balance) || 0;
      const collected = orderTotal - remaining;

      totalSales += orderTotal;
      totalCollected += collected;

      if (remaining > 0) {
        pendingLayawayBalance += remaining;
        activeLayawayOrders++;
        layawayOrders.push({
          id: order.id,
          customer_name: order.customer_name || 'Mostrador',
          order_total: orderTotal,
          down_payment: Number(order.down_payment) || 0,
          remaining_balance: remaining,
          created_at: order.created_at,
        });
      }

      const method = order.payment_method || 'N/A';
      const cur = byPaymentMethod.get(method) ?? { collected: 0, count: 0 };
      byPaymentMethod.set(method, { collected: cur.collected + collected, count: cur.count + 1 });
    });

    layawayOrders.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const totalOrders = ordersData.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // --- Aggregate item-level metrics ---
    let totalItemsSold = 0;
    const bySeller = new Map<string, { total: number; count: number }>();
    const byProduct = new Map<string, { quantity: number; total: number }>();
    const seenOrdersBySeller = new Map<string, Set<string>>();

    (itemsData ?? [] as ItemRow[]).forEach((item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.price_at_sale) || 0;
      totalItemsSold += qty;

      // Seller: aggregate item value; track unique orders for count
      const seller = item.seller_name || 'N/A';
      const cur = bySeller.get(seller) ?? { total: 0, count: 0 };
      const orderSet = seenOrdersBySeller.get(seller) ?? new Set<string>();
      const isNewOrder = !orderSet.has(item.order_id);
      orderSet.add(item.order_id);
      seenOrdersBySeller.set(seller, orderSet);
      bySeller.set(seller, {
        total: cur.total + price * qty,
        count: cur.count + (isNewOrder ? 1 : 0),
      });

      // Products
      const product = item.product_name || 'N/A';
      const curP = byProduct.get(product) ?? { quantity: 0, total: 0 };
      byProduct.set(product, { quantity: curP.quantity + qty, total: curP.total + price * qty });
    });

    return {
      totalSales,
      totalCollected,
      totalOrders,
      totalItemsSold,
      averageOrderValue,
      pendingLayawayBalance,
      activeLayawayOrders,
      collectedByPaymentMethod: Array.from(byPaymentMethod.entries())
        .map(([method, d]) => ({ method, ...d }))
        .sort((a, b) => b.collected - a.collected),
      salesBySeller: Array.from(bySeller.entries())
        .map(([seller, d]) => ({ seller, ...d }))
        .sort((a, b) => b.total - a.total),
      topSellingProducts: Array.from(byProduct.entries())
        .map(([product, d]) => ({ product, ...d }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10),
      layawayOrders,
    };

  } catch (error) {
    console.error('Error generating financial report:', error);
    return empty;
  }
}
