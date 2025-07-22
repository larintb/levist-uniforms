// @/app/admin/orders/[id]/page.tsx
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import React from 'react';
import { Receipt } from '@/components/admin/Receipt';

// Esta página ahora está dedicada a mostrar el recibo imprimible.
// Todas las acciones de gestión se manejan en la página interactiva de órdenes.

// El tipo de datos debe coincidir con el que espera el componente Receipt.
type OrderDetailsForReceipt = {
    order_id: string;
    order_date: string;
    order_total: number;
    subtotal: number;
    discount_amount: number;
    discount_reason: string | null;
    order_status: string;
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

// --- Función getOrderDetails (SIMPLIFICADA Y MEJORADA) ---
// Utiliza la 'full_order_details_view' para mayor eficiencia y consistencia.
async function getOrderDetailsForReceipt(orderId: string): Promise<OrderDetailsForReceipt | null> {
    const supabase = await createClient();
    
    // 1. Obtener todos los detalles relacionados con los ítems desde la vista eficiente
    const { data: viewData, error: viewError } = await supabase
        .from('full_order_details_with_statuses')
        .select('*')
        .eq('order_id', orderId);

    if (viewError || !viewData || viewData.length === 0) {
        console.error('Error al obtener detalles de la orden desde la vista:', viewError?.message);
        return null;
    }

    // 2. Obtener detalles a nivel de orden (como la razón del descuento) directamente de la tabla de órdenes
    const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('discount_reason, subtotal, discount_amount, is_layaway, down_payment, remaining_balance') // Incluimos campos de separado
        .eq('id', orderId)
        .single();
    
    if (orderError) {
        console.error('Error al obtener detalles a nivel de orden:', orderError?.message);
        return null;
    }

    // 3. Agregar los datos en un solo objeto
    const orderInfo = viewData[0]; 

    const items = viewData.map(row => ({
        item_id: row.item_id,
        product_name: row.product_name,
        sku: row.sku,
        color: row.color,
        size: row.size,
        quantity: row.quantity,
        price_at_sale: row.price_at_sale,
        delivered: row.delivered,
    }));

    const orderDetails: OrderDetailsForReceipt = {
        order_id: orderInfo.order_id,
        order_date: orderInfo.order_date,
        order_total: orderInfo.order_total,
        subtotal: orderData.subtotal, // Usamos el valor fiable de la tabla de órdenes
        discount_amount: orderData.discount_amount, // Usamos el valor fiable
        discount_reason: orderData.discount_reason, // Obtenemos la razón
        order_status: orderInfo.order_status,
        payment_method: orderInfo.payment_method,
        seller_name: orderInfo.seller_name,
        customer_name: orderInfo.customer_name,
        customer_phone: orderInfo.customer_phone,
        embroidery_notes: orderInfo.embroidery_notes,
        requires_invoice: orderInfo.requires_invoice,
        school_name: orderInfo.school_name,
        is_layaway: orderData.is_layaway,
        down_payment: orderData.down_payment,
        remaining_balance: orderData.remaining_balance,
        items: items,
    };

    return orderDetails;
}

// --- Componente de Página Simplificado ---
export default async function OrderReceiptPage({ params }: { params: Promise<{ id: string }> }) {
    // Await params before accessing its properties
    const { id } = await params;
    
    const orderDetails = await getOrderDetailsForReceipt(id);

    if (!orderDetails) {
        notFound();
    }

    // Esta página ahora renderiza exclusivamente el componente Receipt.
    // Sirve como una vista limpia y amigable para la impresión de una orden específica.
    return (
        <div className="bg-gray-100 min-h-screen">
            <Receipt details={orderDetails} />
        </div>
    );
}