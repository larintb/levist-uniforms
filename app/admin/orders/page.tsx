// @/app/admin/orders/page.tsx
"use client";

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { updateItemDeliveryStatus, updateAllItemsDeliveryStatus } from './actions';
import { updateOrderMultipleStatuses } from './multiple-status-actions';
import { sendWhatsAppNotification } from './[id]/actions';
import { MultiCopyPrintButton } from '@/components/admin/MultiCopyPrintButton';

// --- Tipos de Datos ---
type OrderItem = {
    item_id: string;
    product_name: string;
    sku: string;
    color: string;
    size: string;
    quantity: number;
    price_at_sale: number;
    delivered: boolean;
};

type Order = {
    id: string;
    created_at: string;
    customer_name: string | null;
    customer_phone: string | null;
    total: number;
    subtotal: number;
    discount_amount: number;
    discount_reason: string | null;
    status: string; // Mantenemos para compatibilidad, pero será el estado principal
    active_statuses: string[]; // Nuevo: array de estados activos
    seller_name: string | null;
    payment_method: string | null;
    embroidery_notes: string | null;
    requires_invoice: boolean;
    school_name: string | null;
    is_layaway: boolean;
    down_payment: number;
    remaining_balance: number;
    items: OrderItem[];
};

type OrderViewRow = {
    order_id: string;
    order_date: string;
    order_total: number;
    order_status: string;
    active_statuses: string[];
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
    is_layaway: boolean;
    down_payment: number;
    remaining_balance: number;
    item_id: string;
    product_name: string;
    sku: string;
    color: string;
    size: string;
    quantity: number;
    price_at_sale: number;
    delivered: boolean;
};

// --- Componente de Insignia de Estado (Diseño Mejorado para Estados Múltiples) ---
const StatusBadge = ({ status }: { status: string | null }) => {
    const statusInfo = {
        COMPLETED: { text: 'Completado', color: 'bg-green-100 text-green-800 ring-green-600/20' },
        PENDING_EMBROIDERY: { text: 'Bordado', color: 'bg-yellow-100 text-yellow-800 ring-yellow-600/20' },
        PENDING_SUPPLIER: { text: 'Proveedor', color: 'bg-blue-100 text-blue-800 ring-blue-600/20' },
        PENDING_PAYMENT: { text: 'Pago Pendiente', color: 'bg-orange-100 text-orange-800 ring-orange-600/20' },
        READY_FOR_PICKUP: { text: 'Listo', color: 'bg-indigo-100 text-indigo-800 ring-indigo-600/20' },
        DELIVERED: { text: 'Entregado', color: 'bg-gray-200 text-gray-800 ring-gray-600/20' },
        LAYAWAY: { text: 'Separado', color: 'bg-purple-100 text-purple-800 ring-purple-600/20' },
    } as const;
    const currentStatus = statusInfo[status as keyof typeof statusInfo] || { text: status || 'N/A', color: 'bg-gray-100 text-gray-700 ring-gray-500/20' };
    return <span className={`px-2 py-1 text-xs font-bold rounded-full ring-1 ring-inset ${currentStatus.color}`}>{currentStatus.text}</span>;
};

// --- Componente para múltiples badges de estado ---
const MultipleStatusBadges = ({ statuses }: { statuses: string[] }) => {
    if (!statuses || statuses.length === 0) {
        return <StatusBadge status="N/A" />;
    }
    
    // Mostrar todos los estados apilados verticalmente para evitar empalmes
    return (
        <div className="flex flex-col gap-1">
            {statuses.map((status, index) => (
                <StatusBadge key={`${status}-${index}`} status={status} />
            ))}
        </div>
    );
};

// --- Columna Izquierda: Lista de Ordenes (Diseño Mejorado) ---
const OrderListColumn = ({ orders, selectedOrder, setSelectedOrder, setFilter, setSortOrder, setDateFilter }: { 
    orders: Order[], 
    selectedOrder: Order | null, 
    setSelectedOrder: (order: Order) => void, 
    setFilter: (status: string) => void,
    setSortOrder: (order: 'asc' | 'desc') => void,
    setDateFilter: (filter: string) => void
}) => {
    const statuses = ["ALL", "PENDING_PAYMENT", "READY_FOR_PICKUP", "PENDING_EMBROIDERY", "PENDING_SUPPLIER", "LAYAWAY", "COMPLETED"];
    const dateFilters = ["ALL_TIME", "TODAY", "THIS_WEEK", "THIS_MONTH"];
    const [activeFilter, setActiveFilter] = useState("ALL");
    const [activeDateFilter, setActiveDateFilter] = useState("ALL_TIME");
    const [activeSortOrder, setActiveSortOrder] = useState<'asc' | 'desc'>('desc');

    const handleFilterClick = (status: string) => {
        setActiveFilter(status);
        setFilter(status);
    };

    const handleDateFilterClick = (dateFilter: string) => {
        setActiveDateFilter(dateFilter);
        setDateFilter(dateFilter);
    };

    const handleSortOrderClick = (order: 'asc' | 'desc') => {
        setActiveSortOrder(order);
        setSortOrder(order);
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'ALL': return 'Todas';
            case 'PENDING_PAYMENT': return 'Pago Pendiente';
            case 'READY_FOR_PICKUP': return 'Listo';
            case 'PENDING_EMBROIDERY': return 'Bordado';
            case 'PENDING_SUPPLIER': return 'Proveedor';
            case 'LAYAWAY': return 'Separado';
            case 'COMPLETED': return 'Completado';
            default: return status.replace(/_/g, ' ').charAt(0).toUpperCase() + status.replace(/_/g, ' ').slice(1).toLowerCase();
        }
    };

    const getDateFilterLabel = (filter: string) => {
        switch (filter) {
            case 'ALL_TIME': return 'Todo el tiempo';
            case 'TODAY': return 'Hoy';
            case 'THIS_WEEK': return 'Esta semana';
            case 'THIS_MONTH': return 'Este mes';
            default: return filter;
        }
    };

    return (
        <div className="flex flex-col bg-white h-full border-r border-gray-200">
            <div className="p-4 border-b border-gray-200">
                <h1 className="text-xl font-bold text-gray-900">Ordenes</h1>
                
                {/* Filtros de Estado */}
                <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Estados:</h3>
                    <div className="flex space-x-2 overflow-x-auto pb-2">
                        {statuses.map(status => (
                            <button key={status} onClick={() => handleFilterClick(status)} className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${activeFilter === status ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                {getStatusLabel(status)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filtros de Fecha */}
                <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Período:</h3>
                    <div className="flex space-x-2 overflow-x-auto pb-2">
                        {dateFilters.map(filter => (
                            <button key={filter} onClick={() => handleDateFilterClick(filter)} className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${activeDateFilter === filter ? 'bg-green-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                {getDateFilterLabel(filter)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Ordenamiento */}
                <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Ordenar por fecha:</h3>
                    <div className="flex space-x-2">
                        <button onClick={() => handleSortOrderClick('desc')} className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${activeSortOrder === 'desc' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                            ⬇️ Más recientes
                        </button>
                        <button onClick={() => handleSortOrderClick('asc')} className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${activeSortOrder === 'asc' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                            ⬆️ Más antiguos
                        </button>
                    </div>
                </div>
            </div>
            <ul className="flex-1 overflow-y-auto divide-y divide-gray-200">
                {orders.map(order => (
                    <li key={order.id}>
                        <button onClick={() => setSelectedOrder(order)} className={`w-full text-left p-4 transition-colors ${selectedOrder?.id === order.id ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}>
                            <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-800 truncate">{order.customer_name || 'Cliente Mostrador'}</p>
                                    {order.customer_phone && (
                                        <p className="text-xs text-gray-600 mt-0.5 truncate">📞 {order.customer_phone}</p>
                                    )}
                                    {order.school_name && (
                                        <p className="text-xs text-blue-600 mt-0.5 truncate font-medium">🏫 {order.school_name}</p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-0.5">📅 {new Date(order.created_at).toLocaleDateString('es-MX', { month: 'short', day: 'numeric', year: '2-digit' })}</p>
                                </div>
                                <p className="text-base font-bold text-gray-900 ml-2">${(order.total || 0).toFixed(2)}</p>
                            </div>
                            <div className="flex justify-between items-start mt-2">
                                <p className="text-xs text-gray-500 font-mono">#{order.id.toUpperCase().slice(0, 8)}</p>
                                <div className="flex-shrink-0">
                                    <MultipleStatusBadges statuses={order.active_statuses} />
                                </div>
                            </div>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

// --- Columna Derecha: Detalle de la Orden (Diseño Mejorado) ---
const OrderDetailColumn = ({ order, onRefresh }: { order: Order | null, onRefresh: () => Promise<void> }) => {
    const [isUpdating, startUpdateTransition] = useTransition();
    const [isNotifying, startNotifyTransition] = useTransition();
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showNotifyModal, setShowNotifyModal] = useState(false);
    const [showDeliveryModal, setShowDeliveryModal] = useState(false);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [pendingDeliveryChange, setPendingDeliveryChange] = useState<{
        itemId: string;
        itemName: string;
        delivered: boolean;
    } | null>(null);

    // Definir estados disponibles y sus reglas
    const availableStatuses = [
        { key: 'PENDING_PAYMENT', label: 'Pago Pendiente', description: 'Cliente debe completar el pago' },
        { key: 'PENDING_SUPPLIER', label: 'Pendiente Proveedor', description: 'Esperando productos del proveedor' },
        { key: 'PENDING_EMBROIDERY', label: 'Pendiente Bordado', description: 'Requiere trabajo de bordado' },
        { key: 'READY_FOR_PICKUP', label: 'Listo para Entrega', description: 'Orden lista para entregar al cliente' },
        { key: 'DELIVERED', label: 'Entregado', description: 'Orden entregada al cliente' },
        { key: 'COMPLETED', label: 'Completado', description: 'Proceso finalizado completamente' },
    ];

    // Sincronizar estados seleccionados cuando cambia la orden
    useEffect(() => {
        if (order) {
            setSelectedStatuses(order.active_statuses || []);
        }
    }, [order]);

    if (!order) return <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-8 text-center"><div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 text-2xl font-bold mb-4">📋</div><h2 className="mt-4 text-2xl font-bold text-gray-800">Selecciona una orden</h2><p className="mt-1 text-gray-600">Toca una orden de la lista para ver sus detalles aqui.</p></div>;
    
    const handleStatusToggle = (statusKey: string) => {
        setSelectedStatuses(prev => {
            if (prev.includes(statusKey)) {
                return prev.filter(s => s !== statusKey);
            } else {
                return [...prev, statusKey];
            }
        });
    };

    const handleUpdateMultipleStatuses = () => {
        startUpdateTransition(async () => {
            const result = await updateOrderMultipleStatuses(
                order!.id, 
                selectedStatuses,
                'admin_user' // Aquí podrías pasar el usuario actual
            );
            
            if (result.success) {
                await onRefresh();
                alert('Estados actualizados exitosamente');
            } else {
                alert(`Error: ${result.message}`);
            }
            setShowStatusModal(false);
        });
    };

    const handleNotify = () => {
        if (!order.customer_phone || !order.customer_name) { 
            alert("Este cliente no tiene un numero de telefono o nombre para notificar."); 
            return; 
        }
        setShowNotifyModal(true);
    };

    const handleItemDeliveryToggle = (itemId: string, itemName: string, delivered: boolean) => {
        setPendingDeliveryChange({
            itemId,
            itemName,
            delivered
        });
        setShowDeliveryModal(true);
    };

    const handleConfirmDeliveryChange = async () => {
        if (!pendingDeliveryChange) return;
        
        try {
            const result = await updateItemDeliveryStatus(
                pendingDeliveryChange.itemId, 
                pendingDeliveryChange.delivered
            );
            if (result.success) {
                await onRefresh();
                setShowDeliveryModal(false);
                setPendingDeliveryChange(null);
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (error) {
            console.error('Error updating item delivery status:', error);
            alert('Error al actualizar el estado de entrega del ítem');
        }
    };

    const handleUpdateAllItemsDelivery = async (orderId: string, delivered: boolean) => {
        try {
            const result = await updateAllItemsDeliveryStatus(orderId, delivered);
            if (result.success) {
                await onRefresh();
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (error) {
            console.error('Error updating all items delivery status:', error);
            alert('Error al actualizar el estado de entrega de todos los ítems');
        }
    };

    const handleConfirmNotify = () => {
        startNotifyTransition(async () => {
            const result = await sendWhatsAppNotification(order.customer_phone!, order.customer_name!, order.id);
            alert(result.message);
            setShowNotifyModal(false);
        });
    };

    const handlePrintReceipt = () => {
        window.open(`/admin/orders/${order.id}`, '_blank');
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <header className="bg-white p-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Orden #{order.id.toUpperCase().slice(0, 8)}</h2>
                    <p className="text-sm text-gray-600 truncate">Cliente: {order.customer_name}</p>
                </div>
                <div className="flex items-center space-x-2">
                    <button 
                        onClick={handlePrintReceipt} 
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                        title="Imprimir Recibo"
                    >
                        Recibo
                    </button>
                    <MultiCopyPrintButton 
                        orderId={order.id} 
                        orderHasEmbroidery={!!order.embroidery_notes}
                        className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
                        buttonText="Múltiples"
                        showIcons={false}
                    />
                    <button 
                        onClick={() => setShowStatusModal(true)} 
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                        title="Actualizar Estado"
                    >
                        Estado
                    </button>
                    <button 
                        onClick={handleNotify} 
                        disabled={isNotifying || !order.customer_phone} 
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        title="Notificar Cliente"
                    >
                        {isNotifying ? 'Enviando...' : 'Notificar'}
                    </button>
                </div>
            </header>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="bg-white p-5 rounded-xl shadow-sm ring-1 ring-gray-900/5">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Resumen de la Orden</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Estados:</span> 
                            <MultipleStatusBadges statuses={order.active_statuses} />
                        </div>
                        <div className="flex justify-between items-center"><span className="text-gray-600">Fecha:</span> <span className="font-medium text-gray-800">{new Date(order.created_at).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</span></div>
                        <div className="flex justify-between items-center"><span className="text-gray-600">Vendedor:</span> <span className="font-medium text-gray-800">{order.seller_name || 'N/A'}</span></div>
                        <div className="flex justify-between items-center"><span className="text-gray-600">Metodo de Pago:</span> <span className="font-medium text-gray-800">{order.payment_method}</span></div>
                        {order.is_layaway && (
                            <>
                                <div className="border-t pt-3 mt-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-gray-600 font-semibold">🏦 Separado</span>
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold">APARTADO</span>
                                    </div>
                                    <div className="flex justify-between items-center"><span className="text-gray-600">Anticipo Pagado:</span> <span className="font-medium text-black">${order.down_payment.toFixed(2)}</span></div>
                                    <div className="flex justify-between items-center"><span className="text-gray-600">Saldo Pendiente:</span> <span className={`font-medium ${order.remaining_balance > 0 ? 'text-black' : 'text-black'}`}>${order.remaining_balance.toFixed(2)}</span></div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm ring-1 ring-gray-900/5">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-base font-semibold text-gray-900">Items del Pedido</h3>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleUpdateAllItemsDelivery(order.id, true)}
                                className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-xs font-medium"
                                title="Marcar todos como entregados"
                            >
                                ✓ Todos
                            </button>
                            <button 
                                onClick={() => handleUpdateAllItemsDelivery(order.id, false)}
                                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs font-medium"
                                title="Desmarcar todos"
                            >
                                ✗ Ninguno
                            </button>
                        </div>
                    </div>
                    <ul className="divide-y divide-gray-200">
                        {order.items.map(item => (
                            <li key={item.item_id} className="py-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3 flex-1">
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={item.delivered}
                                                onChange={(e) => handleItemDeliveryToggle(item.item_id, item.product_name, e.target.checked)}
                                                className="rounded border-gray-300 text-green-600 shadow-sm focus:border-green-300 focus:ring focus:ring-green-200 focus:ring-opacity-50"
                                            />
                                            <span className="ml-2 text-xs font-medium text-gray-600">
                                                {item.delivered ? '✅ Entregado' : '⏳ Pendiente'}
                                            </span>
                                        </label>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-800 text-sm">{item.product_name}</p>
                                            <p className="text-xs text-gray-500">
                                                {item.sku} | Talla: {item.size} | Color: {item.color} | Cant: {item.quantity}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="font-semibold text-gray-800 text-sm">${((item.price_at_sale || 0) * (item.quantity || 1)).toFixed(2)}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                        <div className="border-t border-gray-200 mt-4 pt-4 space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-gray-600">Subtotal:</span><span className="font-medium text-gray-800">${(order.subtotal || 0).toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-gray-600">Descuento:</span><span className="font-medium text-red-600">-${(order.discount_amount || 0).toFixed(2)}</span></div>
                            <div className="flex justify-between font-bold text-base"><span className="text-gray-900">Total:</span><span className="text-gray-900">${(order.total || 0).toFixed(2)}</span></div>
                        </div>
                </div>
                {(order.embroidery_notes || order.school_name) && 
                    <div className="bg-white p-5 rounded-xl shadow-sm ring-1 ring-gray-900/5">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Detalles Adicionales</h3>
                        {order.school_name && <p className="text-sm"><span className="font-semibold text-gray-800">Escuela:</span> {order.school_name}</p>}
                        {order.embroidery_notes && <p className="text-sm mt-2"><span className="font-semibold text-gray-800">Notas de Bordado:</span> <span className="text-gray-600 whitespace-pre-wrap">{order.embroidery_notes}</span></p>}
                    </div>
                }
            </div>
            {showNotifyModal && 
                <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowNotifyModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-300 p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-center mb-4 text-black">Confirmar Notificación</h3>
                        <div className="mb-6 text-center">
                            <p className="text-gray-700 mb-2">¿Deseas enviar una notificación por WhatsApp a:</p>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="font-semibold text-gray-900">{order.customer_name}</p>
                                <p className="text-sm text-gray-600">📞 {order.customer_phone}</p>
                                <p className="text-xs text-gray-500 mt-2">Orden: #{order.id.toUpperCase().slice(0, 8)}</p>
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <button 
                                onClick={() => setShowNotifyModal(false)}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleConfirmNotify}
                                disabled={isNotifying}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isNotifying ? 'Enviando...' : 'Enviar Notificación'}
                            </button>
                        </div>
                    </div>
                </div>
            }
            {showDeliveryModal && pendingDeliveryChange &&
                <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { setShowDeliveryModal(false); setPendingDeliveryChange(null); }}>
                    <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-300 p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-center mb-4 text-black">
                            {pendingDeliveryChange.delivered ? 'Confirmar Entrega' : 'Confirmar Cambio a Pendiente'}
                        </h3>
                        <div className="mb-6 text-center">
                            <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                <p className="font-semibold text-gray-900 text-sm">{pendingDeliveryChange.itemName}</p>
                                <p className="text-xs text-gray-500 mt-2">Orden: #{order.id.toUpperCase().slice(0, 8)}</p>
                            </div>
                            <p className="text-gray-700 text-sm">
                                {pendingDeliveryChange.delivered 
                                    ? '¿Confirmas que este ítem ha sido entregado al cliente?' 
                                    : '¿Confirmas que quieres marcar este ítem como pendiente de entrega?'
                                }
                            </p>
                        </div>
                        <div className="flex space-x-3">
                            <button 
                                onClick={() => { setShowDeliveryModal(false); setPendingDeliveryChange(null); }}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleConfirmDeliveryChange}
                                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors font-medium ${
                                    pendingDeliveryChange.delivered 
                                        ? 'bg-green-600 hover:bg-green-700' 
                                        : 'bg-orange-600 hover:bg-orange-700'
                                }`}
                            >
                                {pendingDeliveryChange.delivered ? '✅ Confirmar Entrega' : '⏳ Marcar Pendiente'}
                            </button>
                        </div>
                    </div>
                </div>
            }
            {showStatusModal && 
                <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowStatusModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-300 p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-center mb-6 text-black">Estados de la Orden</h3>
                        <div className="text-xs text-gray-500 mb-4 text-center">
                            Selecciona todos los estados que aplican a esta orden
                        </div>
                        
                        <div className="space-y-3 mb-6 max-h-80 overflow-y-auto">
                            {availableStatuses.map(status => {
                                const isSelected = selectedStatuses.includes(status.key);
                                const isCompleted = status.key === 'COMPLETED';
                                const isLayawayRelevant = status.key === 'PENDING_PAYMENT' && order?.is_layaway;
                                
                                return (
                                    <div key={status.key} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                                        <label className="flex items-start space-x-3 cursor-pointer flex-1">
                                            <div className="flex-shrink-0 mt-0.5">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleStatusToggle(status.key)}
                                                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-medium text-gray-900 text-sm">
                                                        {status.label}
                                                    </span>
                                                    {isSelected && <StatusBadge status={status.key} />}
                                                    {isLayawayRelevant && (
                                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                                            APARTADO
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {status.description}
                                                </p>
                                                {isCompleted && isSelected && (
                                                    <p className="text-xs text-yellow-600 mt-1 font-medium">
                                                        ⚠️ Esto desactivará otros estados
                                                    </p>
                                                )}
                                            </div>
                                        </label>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Mostrar estados actuales vs seleccionados */}
                        <div className="bg-gray-50 p-3 rounded-lg mb-4">
                            <div className="text-xs font-medium text-gray-700 mb-2">Estados actuales:</div>
                            <MultipleStatusBadges statuses={order?.active_statuses || []} />
                            
                            {selectedStatuses.length > 0 && (
                                <>
                                    <div className="text-xs font-medium text-gray-700 mt-3 mb-2">Nuevos estados:</div>
                                    <MultipleStatusBadges statuses={selectedStatuses} />
                                </>
                            )}
                        </div>

                        <div className="flex space-x-3">
                            <button 
                                onClick={() => {
                                    setShowStatusModal(false);
                                    setSelectedStatuses(order?.active_statuses || []);
                                }}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleUpdateMultipleStatuses}
                                disabled={isUpdating}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUpdating ? 'Actualizando...' : 'Guardar Estados'}
                            </button>
                        </div>
                    </div>
                </div>
            }
        </div>
    );
};

// --- Componente Principal de la Pagina ---
export default function OrdersInteractivePage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");
    const [dateFilter, setDateFilter] = useState("ALL_TIME");
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const supabase = createClient();

    // Función para filtrar por fecha
    const filterOrdersByDate = (orders: Order[], dateFilter: string): Order[] => {
        if (dateFilter === "ALL_TIME") return orders;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        return orders.filter(order => {
            const orderDate = new Date(order.created_at);
            const orderDay = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
            
            switch (dateFilter) {
                case 'TODAY':
                    return orderDay.getTime() === today.getTime();
                case 'THIS_WEEK':
                    const weekStart = new Date(today);
                    weekStart.setDate(today.getDate() - today.getDay());
                    return orderDate >= weekStart && orderDate <= now;
                case 'THIS_MONTH':
                    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                    return orderDate >= monthStart && orderDate <= now;
                default:
                    return true;
            }
        });
    };

    // Función para ordenar por fecha
    const sortOrdersByDate = (orders: Order[], sortOrder: 'asc' | 'desc'): Order[] => {
        return [...orders].sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });
    };

    // **FUNCION CORREGIDA**
    // fetchOrders ya no depende de 'selectedOrder', evitando el loop.
    // Solo se encarga de obtener los datos y actualizar la lista principal de ordenes.
    const fetchOrders = useCallback(async () => {
        const { data, error } = await supabase.from('full_order_details_with_statuses').select('*').order('order_date', { ascending: false });
        
        if (error) { 
            console.error("Error fetching orders:", error); 
            setIsLoading(false);
            return; 
        }

        const ordersMap = new Map<string, Order>();
        data.forEach((row: OrderViewRow) => {
            if (!ordersMap.has(row.order_id)) {
                // Preparar los estados activos, incluyendo LAYAWAY si es separado
                let activeStatuses = row.active_statuses || [];
                if (row.is_layaway && !activeStatuses.includes('LAYAWAY')) {
                    activeStatuses = [...activeStatuses, 'LAYAWAY'];
                }
                
                ordersMap.set(row.order_id, {
                    id: row.order_id, 
                    created_at: row.order_date, 
                    total: row.order_total, 
                    status: row.order_status,
                    active_statuses: activeStatuses,
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
                    is_layaway: row.is_layaway,
                    down_payment: row.down_payment,
                    remaining_balance: row.remaining_balance,
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
                delivered: row.delivered || false,
            });
        });
        
        const allOrders = Array.from(ordersMap.values());
        setOrders(allOrders);
    }, [supabase]);

    // **HOOK CORREGIDO**
    // useEffect para la carga inicial y la suscripcion a cambios en tiempo real.
    useEffect(() => {
        setIsLoading(true);
        fetchOrders().finally(() => setIsLoading(false));

        const channel = supabase.channel('realtime-orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, 
                (payload) => {
                    console.log('Order change detected:', payload);
                    fetchOrders();
                }
            )
            .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, 
                (payload) => {
                    console.log('Order items change detected:', payload);
                    fetchOrders();
                }
            )
            .subscribe();

        return () => { 
            supabase.removeChannel(channel); 
        };
    }, [fetchOrders, supabase]);
    
    // **HOOK CORREGIDO**
    // useEffect para filtrar y manejar la seleccion cuando el filtro, fecha, orden o las ordenes cambian.
    useEffect(() => {
        // Primero filtrar por estado
        const statusFiltered = filter === "ALL" ? orders : orders.filter(o => {
            // Si no hay estados activos, usar el estado principal para compatibilidad
            const statusesToCheck = o.active_statuses?.length > 0 ? o.active_statuses : [o.status];
            return statusesToCheck.includes(filter);
        });

        // Luego filtrar por fecha
        const dateFiltered = filterOrdersByDate(statusFiltered, dateFilter);

        // Finalmente ordenar
        const sortedAndFiltered = sortOrdersByDate(dateFiltered, sortOrder);
        
        setFilteredOrders(sortedAndFiltered);
        
        const isSelectedOrderInFilteredList = sortedAndFiltered.some(o => o.id === selectedOrder?.id);

        if (!isSelectedOrderInFilteredList) {
            setSelectedOrder(sortedAndFiltered.length > 0 ? sortedAndFiltered[0] : null);
        } else {
            // Si la orden seleccionada sigue en la lista, la actualizamos con los datos mas recientes
            const updatedOrder = sortedAndFiltered.find(o => o.id === selectedOrder?.id);
            if (updatedOrder) {
                setSelectedOrder(updatedOrder);
            }
        }
    }, [filter, dateFilter, sortOrder, orders, selectedOrder?.id]);

    if (isLoading && orders.length === 0) {
        return <div className="flex items-center justify-center h-screen bg-gray-50"><p className="text-xl font-semibold text-gray-700">Cargando ordenes...</p></div>;
    }

    return (
        <div className="h-screen w-full flex font-sans antialiased overflow-hidden bg-gray-50">
            <div className="w-1/3 max-w-md h-full flex-shrink-0">
                <OrderListColumn 
                    orders={filteredOrders} 
                    selectedOrder={selectedOrder} 
                    setSelectedOrder={setSelectedOrder} 
                    setFilter={setFilter}
                    setSortOrder={setSortOrder}
                    setDateFilter={setDateFilter}
                />
            </div>
            <div className="flex-1 h-full">
                <OrderDetailColumn order={selectedOrder} onRefresh={fetchOrders} />
            </div>
        </div>
    );
}