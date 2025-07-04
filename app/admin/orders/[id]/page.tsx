// @/app/admin/orders/[id]/page.tsx
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import React from 'react';
import { Receipt } from '@/components/admin/Receipt';
import { UpdateStatusForm } from '@/components/admin/UpdateStatusForm';
import { PrintTicketButton } from '@/components/admin/PrintTicketButton';
import { NotifyCustomerButton } from './NotifyCustomerButton'; // Importamos el botón actualizado

// --- Tipos (Sin cambios) ---
type OrderItem = {
    item_id: string;
    product_name: string;
    sku: string;
    color: string;
    size: string;
    quantity: number;
    price_at_sale: number;
};

type OrderDetails = {
    order_id: string;
    order_date: string;
    order_total: number;
    order_status: string;
    payment_method: string;
    seller_name: string | null;
    customer_name: string;
    customer_phone: string | null;
    embroidery_notes: string | null;
    requires_invoice: boolean;
    school_id: string | null;
    school_name?: string;
    items: OrderItem[];
};

// --- Función getOrderDetails (Sin cambios) ---
async function getOrderDetails(orderId: string): Promise<OrderDetails | null> {
    const supabase = await createClient();
    const { data: orderItemsData, error } = await supabase
        .from('full_order_details')
        .select('*')
        .eq('order_id', orderId);

    if (error || !orderItemsData || orderItemsData.length === 0) {
        console.error('Error fetching order details:', error?.message);
        return null;
    }

    const orderInfo = orderItemsData[0];
    let schoolName: string | undefined;

    if (orderInfo.school_id) {
        const { data: schoolData, error: schoolError } = await supabase
            .from('schools')
            .select('name')
            .eq('id', orderInfo.school_id)
            .single();
        if (schoolError) console.error('Error fetching school name:', schoolError.message);
        schoolName = schoolData?.name;
    }

    const orderDetails: OrderDetails = {
        order_id: orderInfo.order_id,
        order_date: orderInfo.order_date,
        order_total: orderInfo.order_total,
        order_status: orderInfo.order_status,
        requires_invoice: orderInfo.requires_invoice,
        payment_method: orderInfo.payment_method,
        seller_name: orderInfo.seller_name,
        customer_name: orderInfo.customer_name,
        customer_phone: orderInfo.customer_phone,
        embroidery_notes: orderInfo.embroidery_notes,
        school_id: orderInfo.school_id,
        school_name: schoolName,
        items: orderItemsData.map(row => ({
            item_id: row.item_id,
            product_name: row.product_name,
            sku: row.sku,
            color: row.color,
            size: row.size,
            quantity: row.quantity,
            price_at_sale: row.price_at_sale,
        })),
    };

    return orderDetails;
}

// --- Componente OrderHeader (Sin cambios) ---
const OrderHeader = ({ orderId }: { orderId: string }) => (
    <header className="mb-8 flex justify-between items-center">
        <div>
            <Link href="/admin/orders" className="text-sm text-indigo-600 hover:underline mb-2 inline-block font-medium">
                &larr; Volver a todas las órdenes
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Detalle de la Orden</h1>
            <p className="text-lg text-gray-700 mt-1">
                Orden <span className="font-mono bg-gray-100 px-2 py-1 rounded-md text-gray-800 font-semibold">#{orderId.slice(0, 8)}</span>
            </p>
        </div>
        <PrintTicketButton />
    </header>
);

// --- Componente OrderItemsList (Sin cambios) ---
const OrderItemsList = ({ items }: { items: OrderItem[] }) => (
    <div className="bg-white rounded-2xl shadow-lg ring-1 ring-gray-900/5">
        <h2 className="text-xl font-semibold text-gray-900 p-6">Ítems del Pedido</h2>
        <ul className="divide-y divide-gray-200">
            {items.map((item) => (
                <li key={item.item_id} className="p-6 flex justify-between items-start sm:items-center flex-col sm:flex-row gap-4">
                    <div>
                        <p className="font-bold text-gray-900">{item.product_name}</p>
                        <p className="text-sm text-gray-700 font-medium">SKU: {item.sku} | Talla: {item.size}</p>
                    </div>
                    <div className="text-left sm:text-right flex-shrink-0">
                        <p className="font-bold text-gray-900">${item.price_at_sale.toFixed(2)} x {item.quantity}</p>
                        <p className="text-sm text-gray-700 font-medium">Subtotal: ${(item.price_at_sale * item.quantity).toFixed(2)}</p>
                    </div>
                </li>
            ))}
        </ul>
    </div>
);

// --- Componente OrderSummary (ACTUALIZADO) ---
// Ahora pasa el orderId al botón de notificación
const OrderSummary = ({ details }: { details: OrderDetails }) => (
    <div className="bg-white p-6 rounded-2xl shadow-lg ring-1 ring-gray-900/5 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Resumen</h2>
        <div className="flex justify-between text-lg">
            <span className="text-gray-700 font-medium">Total:</span>
            <span className="font-bold text-gray-900">${details.order_total.toFixed(2)}</span>
        </div>
        <div className="border-t pt-4 space-y-3 text-sm">
            <p><span className="font-semibold text-gray-900">Cliente:</span> <span className="text-gray-800">{details.customer_name}</span></p>
            <p><span className="font-semibold text-gray-900">Teléfono:</span> <span className="text-gray-800">{details.customer_phone || 'N/A'}</span></p>
            <p><span className="font-semibold text-gray-900">Vendedor:</span> <span className="text-gray-800">{details.seller_name || 'N/A'}</span></p>
            <p><span className="font-semibold text-gray-900">Método Pago:</span> <span className="text-gray-800">{details.payment_method}</span></p>
            <p><span className="font-semibold text-gray-900">Fecha:</span> <span className="text-gray-800">{new Date(details.order_date).toLocaleString('es-MX')}</span></p>
        </div>
        {(details.embroidery_notes || details.school_name) && (
            <div className="border-t pt-4 space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Detalles Adicionales</h3>
                {details.school_name && (
                    <p className="text-sm">
                        <span className="font-semibold text-gray-900">Escuela:</span> <span className="text-gray-800">{details.school_name}</span>
                    </p>
                )}
                {details.embroidery_notes && (
                    <p className="text-sm">
                        <span className="font-semibold text-gray-900">Notas:</span> <span className="text-gray-800 whitespace-pre-wrap">{details.embroidery_notes}</span>
                    </p>
                )}
            </div>
        )}
        <div className="border-t pt-4">
            <NotifyCustomerButton 
               customerName={details.customer_name}
               customerPhone={details.customer_phone}
               orderId={details.order_id} // <--- ¡AQUÍ ESTÁ EL CAMBIO!
            />
        </div>
    </div>
);

// --- Componente de Página Principal (CORREGIDO) ---
export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    // Await params antes de acceder a sus propiedades
    const { id } = await params;
    const orderDetails = await getOrderDetails(id);

    if (!orderDetails) {
        notFound();
    }

    return (
        <>
            <div className="p-4 md:p-8 print:hidden">
                <OrderHeader orderId={id} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white p-6 rounded-2xl shadow-lg ring-1 ring-gray-900/5">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Gestión de Estado</h2>
                            <UpdateStatusForm orderId={orderDetails.order_id} currentStatus={orderDetails.order_status} />
                        </div>
                        <OrderItemsList items={orderDetails.items} />
                    </div>
                    <div className="lg:col-span-1">
                        <OrderSummary details={orderDetails} />
                    </div>
                </div>
            </div>
            <div className="hidden print:block">
                <Receipt details={orderDetails} />
            </div>
        </>
    );
}