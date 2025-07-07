// @/app/admin/orders/page.tsx
"use client";

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { updateOrderStatus } from './actions';
import { sendWhatsAppNotification } from './[id]/actions';
import { Receipt } from '@/components/admin/Receipt'; // Importamos el componente Receipt

// --- Tipos de Datos ---
type OrderItem = {
    item_id: string;
    product_name: string;
    sku: string;
    color: string;
    size: string;
    quantity: number;
    price_at_sale: number;
};

// Tipo actualizado para incluir todos los campos necesarios para el recibo
type Order = {
    id: string; // Renombrado de order_id para consistencia
    created_at: string;
    customer_name: string | null;
    customer_phone: string | null;
    total: number; // Renombrado de order_total
    subtotal: number;
    discount_amount: number;
    discount_reason: string | null;
    status: string; // Renombrado de order_status
    seller_name: string | null;
    payment_method: string | null;
    embroidery_notes: string | null;
    requires_invoice: boolean;
    school_name: string | null;
    items: OrderItem[];
};

// Tipo para los datos de la vista de la base de datos
type OrderViewRow = {
    order_id: string;
    order_date: string;
    order_total: number;
    order_status: string;
    subtotal: number;
    discount_amount: number;
    discount_reason: string | null;
    customer_name: string | null;
    customer_phone: string | null;
    seller_name: string | null;
    payment_method: string | null;
    embroidery_notes: string | null;
    requires_invoice: boolean;
    school_name: string | null;
    item_id: string;
    product_name: string;
    sku: string;
    color: string;
    size: string;
    quantity: number;
    price_at_sale: number;
};

// --- Iconos ---
const PrintIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6 18.25m10.56-4.421c.24.03.48.062.72.096m-.72-.096L18 18.25m-12 0h12M12 15V9m0 2.25a.75.75 0 00-.75.75v4.5a.75.75 0 001.5 0v-4.5a.75.75 0 00-1.5 0v-4.5A.75.75 0 0012 11.25z" /></svg>;
const NotifyIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>;
const UpdateIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.667 0l3.181-3.183m-4.991-2.691V5.25a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25h6.75a2.25 2.25 0 002.25-2.25z" /></svg>;


// --- Componente de Insignia de Estado ---
const StatusBadge = ({ status }: { status: string | null }) => {
    const statusInfo = {
        COMPLETED: { text: 'Completado', color: 'bg-green-100 text-green-800' },
        PENDING_EMBROIDERY: { text: 'Bordado', color: 'bg-yellow-100 text-yellow-800' },
        PENDING_SUPPLIER: { text: 'Proveedor', color: 'bg-blue-100 text-blue-800' },
        READY_FOR_PICKUP: { text: 'Listo', color: 'bg-indigo-100 text-indigo-800' },
        DELIVERED: { text: 'Entregado', color: 'bg-gray-200 text-gray-800' },
    } as const;
    const currentStatus = statusInfo[status as keyof typeof statusInfo] || { text: status || 'N/A', color: 'bg-gray-100 text-gray-800' };
    return <span className={`px-4 py-2 text-sm font-bold rounded-full ${currentStatus.color}`}>{currentStatus.text}</span>;
};

// --- Columna Izquierda: Lista de Órdenes ---
const OrderListColumn = ({ orders, selectedOrder, setSelectedOrder, setFilter }: { orders: Order[], selectedOrder: Order | null, setSelectedOrder: (order: Order) => void, setFilter: (status: string) => void }) => {
    const statuses = ["ALL", "READY_FOR_PICKUP", "PENDING_EMBROIDERY", "PENDING_SUPPLIER", "COMPLETED"];
    const [activeFilter, setActiveFilter] = useState("ALL");

    const handleFilterClick = (status: string) => {
        setActiveFilter(status);
        setFilter(status);
    };

    return (
        <div className="flex flex-col bg-white h-full border-r border-gray-200">
            <div className="p-4 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900">Órdenes</h1>
                <div className="mt-4 flex space-x-2 overflow-x-auto pb-2">
                    {statuses.map(status => (
                        <button key={status} onClick={() => handleFilterClick(status)} className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${activeFilter === status ? 'bg-indigo-600 text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                            {status === 'ALL' ? 'Todas' : status.replace(/_/g, ' ').charAt(0).toUpperCase() + status.replace(/_/g, ' ').slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
            </div>
            <ul className="flex-1 overflow-y-auto">
                {orders.map(order => (
                    <li key={order.id}>
                        <button onClick={() => setSelectedOrder(order)} className={`w-full text-left p-4 border-l-4 transition-colors ${selectedOrder?.id === order.id ? 'border-indigo-600 bg-indigo-50' : 'border-transparent hover:bg-gray-50'}`}>
                            <div className="flex justify-between items-center"><p className="font-bold text-gray-800 truncate">{order.customer_name || 'Cliente Mostrador'}</p><p className="text-lg font-bold text-gray-900">${order.total.toFixed(2)}</p></div>
                            <div className="flex justify-between items-center mt-2"><p className="text-sm text-gray-600 font-mono">#{order.id.slice(0, 8)}</p><StatusBadge status={order.status} /></div>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

// --- Columna Derecha: Detalle de la Orden ---
const OrderDetailColumn = ({ order, onShowReceipt }: { order: Order | null, onShowReceipt: (order: Order) => void }) => {
    const [isUpdating, startUpdateTransition] = useTransition();
    const [isNotifying, startNotifyTransition] = useTransition();
    const [showStatusModal, setShowStatusModal] = useState(false);

    if (!order) return <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-8 text-center"><UpdateIcon className="h-16 w-16 text-gray-300" /><h2 className="mt-4 text-2xl font-bold text-gray-800">Selecciona una orden</h2><p className="mt-1 text-gray-600">Toca una orden de la lista para ver sus detalles aquí.</p></div>;
    
    const handleNotify = () => {
        if (!order.customer_phone || !order.customer_name) { alert("Este cliente no tiene un número de teléfono o nombre para notificar."); return; }
        startNotifyTransition(async () => {
            const result = await sendWhatsAppNotification(order.customer_phone!, order.customer_name!, order.id);
            alert(result.message);
        });
    };

    const handleUpdateStatus = (newStatus: string) => {
        startUpdateTransition(async () => {
            await updateOrderStatus(order.id, newStatus);
            setShowStatusModal(false);
        });
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <header className="bg-white p-4 border-b border-gray-200 flex justify-between items-center shadow-sm">
                <div><h2 className="text-xl font-bold text-gray-900">Orden #{order.id.slice(0, 8)}</h2><p className="text-sm text-gray-600 truncate">Cliente: {order.customer_name}</p></div>
                <div className="flex items-center space-x-3">
                    <button onClick={() => onShowReceipt(order)} className="p-3 bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300 transition-colors"><PrintIcon className="h-6 w-6" /></button>
                    <button onClick={() => setShowStatusModal(true)} className="p-3 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"><UpdateIcon className="h-6 w-6" /></button>
                    <button onClick={handleNotify} disabled={isNotifying || !order.customer_phone} className="p-3 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><NotifyIcon className="h-6 w-6" /></button>
                </div>
            </header>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-md ring-1 ring-gray-900/5">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Resumen</h3>
                    <div className="space-y-3 text-base">
                        <div className="flex justify-between"><span className="text-gray-600">Estado:</span> <StatusBadge status={order.status} /></div>
                        <div className="flex justify-between"><span className="text-gray-600">Total:</span> <span className="font-bold text-gray-900">${order.total.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">Fecha:</span> <span className="font-medium text-gray-800">{new Date(order.created_at).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">Vendedor:</span> <span className="font-medium text-gray-800">{order.seller_name || 'N/A'}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">Método de Pago:</span> <span className="font-medium text-gray-800">{order.payment_method}</span></div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-md ring-1 ring-gray-900/5">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Ítems del Pedido</h3>
                    <ul className="divide-y divide-gray-200">
                        {order.items.map(item => (<li key={item.item_id} className="py-4"><div className="flex justify-between"><p className="font-semibold text-gray-800">{item.product_name}</p><p className="font-semibold text-gray-800">${(item.price_at_sale * item.quantity).toFixed(2)}</p></div><p className="text-sm text-gray-600">SKU: {item.sku} | Talla: {item.size} | Cant: {item.quantity}</p></li>))}
                    </ul>
                </div>
                {(order.embroidery_notes || order.school_name) && <div className="bg-white p-6 rounded-2xl shadow-md ring-1 ring-gray-900/5"><h3 className="text-lg font-bold text-gray-900 mb-4">Detalles Adicionales</h3>{order.school_name && <p className="text-base"><span className="font-semibold">Escuela:</span> {order.school_name}</p>}{order.embroidery_notes && <p className="text-base mt-2"><span className="text-black font-semibold">Notas de Bordado:</span> <span className="text-gray-600 whitespace-pre-wrap">{order.embroidery_notes}</span></p>}</div>}
            </div>
            {showStatusModal && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowStatusModal(false)}><div className="bg-white rounded-2xl shadow-2xl p-8 m-4 max-w-sm w-full" onClick={e => e.stopPropagation()}><h3 className="text-black text-2xl font-bold text-center mb-6">Actualizar Estado</h3><div className="text-gray-600 grid grid-cols-1 gap-4">{['READY_FOR_PICKUP', 'PENDING_EMBROIDERY', 'DELIVERED', 'COMPLETED'].map(status => (<button key={status} disabled={isUpdating} onClick={() => handleUpdateStatus(status)} className="w-full text-left p-4 rounded-xl bg-gray-100 hover:bg-indigo-100 hover:text-indigo-800 transition-all duration-200 flex items-center justify-between font-semibold text-lg disabled:opacity-50"><span>{status.replace(/_/g, ' ')}</span><StatusBadge status={status} /></button>))}</div></div></div>}
        </div>
    );
};

// --- Componente para la Modal del Recibo ---
const ReceiptModal = ({ order, onClose }: { order: Order | null, onClose: () => void }) => {
    if (!order) return null;

    // Adaptamos el tipo 'Order' al tipo que espera el componente 'Receipt'
    const receiptDetails = {
        order_id: order.id,
        order_date: order.created_at,
        order_total: order.total,
        order_status: order.status,
        subtotal: order.subtotal,
        discount_amount: order.discount_amount,
        discount_reason: order.discount_reason,
        payment_method: order.payment_method,
        seller_name: order.seller_name,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        embroidery_notes: order.embroidery_notes,
        requires_invoice: order.requires_invoice,
        // CORRECCIÓN: Convertimos 'null' a 'undefined' para que coincida con el tipo esperado.
        school_name: order.school_name ?? undefined,
        items: order.items,
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={onClose}>
            <div className="relative" onClick={e => e.stopPropagation()}>
                <Receipt details={receiptDetails} />
                <button onClick={onClose} className="absolute -top-4 -right-4 bg-white text-gray-800 rounded-full h-10 w-10 flex items-center justify-center shadow-lg font-bold text-xl">&times;</button>
            </div>
        </div>
    );
};

// --- Componente Principal de la Página ---
export default function OrdersInteractivePage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [receiptOrder, setReceiptOrder] = useState<Order | null>(null); // Estado para la modal del recibo
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");
    const supabase = createClient();

    const fetchOrders = useCallback(async () => {
        const { data, error } = await supabase.from('full_order_details_view').select('*').order('order_date', { ascending: false });
        if (error) { 
            console.error("Error fetching orders:", error); 
            setIsLoading(false); 
            return; 
        }

        const ordersMap = new Map<string, Order>();
        data.forEach((row: OrderViewRow) => {
            if (!ordersMap.has(row.order_id)) {
                ordersMap.set(row.order_id, {
                    id: row.order_id, 
                    created_at: row.order_date, 
                    total: row.order_total, 
                    status: row.order_status,
                    subtotal: row.subtotal, 
                    discount_amount: row.discount_amount, 
                    discount_reason: row.discount_reason,
                    customer_name: row.customer_name, 
                    customer_phone: row.customer_phone, 
                    seller_name: row.seller_name,
                    payment_method: row.payment_method, 
                    embroidery_notes: row.embroidery_notes, 
                    requires_invoice: row.requires_invoice,
                    school_name: row.school_name, 
                    items: [],
                });
            }
            const order = ordersMap.get(row.order_id)!;
            order.items.push({
                item_id: row.item_id, 
                product_name: row.product_name, 
                sku: row.sku, 
                color: row.color,
                size: row.size, 
                quantity: row.quantity, 
                price_at_sale: row.price_at_sale,
            });
        });
        
        const allOrders = Array.from(ordersMap.values());
        setOrders(allOrders);
        if (!selectedOrder && allOrders.length > 0) {
            setSelectedOrder(allOrders[0]);
        }
        setIsLoading(false);
    }, [supabase, selectedOrder]);

    useEffect(() => {
        fetchOrders();
        const channel = supabase.channel('realtime-orders').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders()).subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [fetchOrders, supabase]);
    
    useEffect(() => {
        const newFiltered = filter === "ALL" ? orders : orders.filter(o => o.status === filter);
        setFilteredOrders(newFiltered);
        if (selectedOrder && !newFiltered.find(o => o.id === selectedOrder.id)) {
             setSelectedOrder(newFiltered.length > 0 ? newFiltered[0] : null);
        } else if (!selectedOrder && newFiltered.length > 0) {
            setSelectedOrder(newFiltered[0]);
        }
    }, [filter, orders, selectedOrder]);
    
    useEffect(() => {
        if (selectedOrder) {
            const updatedOrder = orders.find(o => o.id === selectedOrder.id);
            if (updatedOrder) setSelectedOrder(updatedOrder);
            else setSelectedOrder(null);
        }
    }, [orders, selectedOrder]);

    if (isLoading) return <div className="flex items-center justify-center h-screen bg-gray-100"><p className="text-xl font-semibold">Cargando órdenes...</p></div>;

    return (
        <div className="h-screen w-full flex font-sans antialiased overflow-hidden">
            <div className="w-1/3 max-w-md h-full flex-shrink-0"><OrderListColumn orders={filteredOrders} selectedOrder={selectedOrder} setSelectedOrder={setSelectedOrder} setFilter={setFilter} /></div>
            <div className="flex-1 h-full"><OrderDetailColumn order={selectedOrder} onShowReceipt={setReceiptOrder} /></div>
            <ReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />
        </div>
    );
}