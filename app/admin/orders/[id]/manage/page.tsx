// @/app/admin/orders/[id]/manage/page.tsx
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import React from 'react';
import { OrderManagementView } from '@/components/admin/OrderManagementView';

// Tipo de datos completo para gestión de orden
type OrderDetailsForManagement = {
    order_id: string;
    order_date: string;
    order_total: number;
    subtotal: number;
    discount_amount: number;
    discount_reason: string | null;
    order_status: string;
    active_statuses: string[];
    payment_method: string | null;
    seller_name: string | null;
    customer_name: string | null;
    customer_phone: string | null;
    embroidery_notes: string | null;
    requires_invoice: boolean;
    school_name?: string;
    is_layaway: boolean;
    down_payment: number;
    remaining_balance: number;
    items: {
        item_id: string;
        product_name: string;
        sku: string;
        color: string;
        size: string;
        quantity: number;
        price_at_sale: number;
        delivered: boolean;
    }[];
};

async function getOrderDetailsForManagement(orderId: string): Promise<OrderDetailsForManagement | null> {
    const supabase = await createClient();
    
    // Obtener detalles completos de la orden desde la vista
    const { data: viewData, error: viewError } = await supabase
        .from('full_order_details_view')
        .select('*')
        .eq('order_id', orderId);

    if (viewError) {
        console.error('Error fetching order details from view:', viewError);
        return null;
    }

    if (!viewData || viewData.length === 0) {
        return null;
    }

    const firstRow = viewData[0];
    
    // Obtener estados activos de la orden
    const { data: statusData, error: statusError } = await supabase
        .from('order_statuses')
        .select('status')
        .eq('order_id', orderId)
        .eq('is_active', true);

    if (statusError) {
        console.error('Error fetching order statuses:', statusError);
    }

    let activeStatuses = statusError ? [] : statusData?.map(s => s.status) || [];
    
    // Si no hay estados activos en order_statuses, usar el estado de la orden principal
    if (activeStatuses.length === 0 && firstRow.order_status) {
        activeStatuses = [firstRow.order_status];
    }

    // Agrupar items
    const items = viewData.map(row => ({
        item_id: row.item_id,
        product_name: row.product_name,
        sku: row.sku,
        color: row.color,
        size: row.size,
        quantity: row.quantity,
        price_at_sale: row.price_at_sale,
        delivered: row.delivered || false,
    }));

    return {
        order_id: firstRow.order_id,
        order_date: firstRow.order_date,
        order_total: parseFloat(firstRow.order_total),
        subtotal: parseFloat(firstRow.subtotal || '0'),
        discount_amount: parseFloat(firstRow.discount_amount || '0'),
        discount_reason: firstRow.discount_reason,
        order_status: firstRow.order_status,
        active_statuses: activeStatuses,
        payment_method: firstRow.payment_method,
        seller_name: firstRow.seller_name,
        customer_name: firstRow.customer_name,
        customer_phone: firstRow.customer_phone,
        embroidery_notes: firstRow.embroidery_notes,
        requires_invoice: firstRow.requires_invoice || false,
        school_name: firstRow.school_name,
        is_layaway: firstRow.is_layaway || false,
        down_payment: parseFloat(firstRow.down_payment || '0'),
        remaining_balance: parseFloat(firstRow.remaining_balance || '0'),
        items: items,
    };
}

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function OrderManagePage({ params }: PageProps) {
    const { id } = await params;
    const orderDetails = await getOrderDetailsForManagement(id);

    if (!orderDetails) {
        notFound();
    }

    return (
        <div>
            <OrderManagementView orderDetails={orderDetails} />
        </div>
    );
}
