'use client';

import React, { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { updateOrderMultipleStatuses } from '@/app/admin/orders/multiple-status-actions';
import { updateItemDeliveryStatus, updateAllItemsDeliveryStatus } from '@/app/admin/orders/actions';
import { sendWhatsAppNotification } from '@/app/admin/orders/[id]/actions';
import { MultiCopyPrintButton } from './MultiCopyPrintButton';

// Tipo de datos para gestión de orden
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

interface OrderManagementViewProps {
    orderDetails: OrderDetailsForManagement;
}

// Iconos
const ArrowLeftIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
);

const PrinterIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6 18.25m10.56-4.421c.24.03.48.062.72.096m-.72-.096L18 18.25m-12 0h12M12 15V9m0 2.25a.75.75 0 0 0-.75.75v4.5a.75.75 0 0 0 1.5 0v-4.5A.75.75 0 0 0 12 11.25Z" />
    </svg>
);

const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);

const PhoneIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
    </svg>
);

// Estados disponibles - Todos los estados establecidos en el sistema
const AVAILABLE_STATUSES = [
    'PENDING_PAYMENT',
    'PENDING_EMBROIDERY', 
    'PENDING_SUPPLIER',
    'READY_FOR_PICKUP',
    'DELIVERED',
    'COMPLETED',
    'LAYAWAY'
];

// Función para obtener el nombre legible del estado
const getStatusDisplayName = (status: string) => {
    switch (status) {
        case 'COMPLETED':
            return 'Completado';
        case 'PENDING_EMBROIDERY':
            return 'Bordado';
        case 'PENDING_SUPPLIER':
            return 'Proveedor';
        case 'PENDING_PAYMENT':
            return 'Pago Pendiente';
        case 'READY_FOR_PICKUP':
            return 'Listo';
        case 'DELIVERED':
            return 'Entregado';
        case 'LAYAWAY':
            return 'Separado';
        default:
            return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    }
};

// Función para obtener el color del estado
const getStatusColor = (status: string) => {
    switch (status) {
        case 'COMPLETED':
            return 'bg-green-100 text-green-800 border-green-200';
        case 'PENDING_EMBROIDERY':
            return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'PENDING_SUPPLIER':
            return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'PENDING_PAYMENT':
            return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'READY_FOR_PICKUP':
            return 'bg-indigo-100 text-indigo-800 border-indigo-200';
        case 'DELIVERED':
            return 'bg-gray-200 text-gray-800 border-gray-300';
        case 'LAYAWAY':
            return 'bg-purple-100 text-purple-800 border-purple-200';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

export function OrderManagementView({ orderDetails }: OrderManagementViewProps) {
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    
    // Inicializar selectedStatuses basado en los estados activos de la orden
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);
    
    const [whatsappMessage, setWhatsappMessage] = useState('');

    // Inicializar estados solo una vez cuando el componente se monta
    useEffect(() => {
        if (!isInitialized) {
            let initialStatuses: string[] = [];
            
            if (orderDetails.active_statuses && Array.isArray(orderDetails.active_statuses) && orderDetails.active_statuses.length > 0) {
                initialStatuses = orderDetails.active_statuses;
            } else if (orderDetails.order_status) {
                initialStatuses = [orderDetails.order_status];
            } else {
                initialStatuses = ['PENDING_PAYMENT'];
            }
            
            setSelectedStatuses(initialStatuses);
            setIsInitialized(true);
        }
    }, [orderDetails.active_statuses, orderDetails.order_status, orderDetails.order_id, isInitialized]);

    // Efecto para limpiar mensajes después de un tiempo
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const handleStatusChange = (status: string, checked: boolean) => {
        setSelectedStatuses(prev => {
            if (checked) {
                // Agregar estado si no está ya incluido
                return prev.includes(status) ? prev : [...prev, status];
            } else {
                // Remover estado
                return prev.filter(s => s !== status);
            }
        });
    };

    const handleUpdateStatuses = () => {
        startTransition(async () => {
            try {
                const result = await updateOrderMultipleStatuses(
                    orderDetails.order_id, 
                    selectedStatuses,
                    'admin_user' // Usuario actual
                );
                
                if (result.success) {
                    setMessage({ type: 'success', text: 'Estados actualizados exitosamente' });
                    // Forzar recarga de la página para mostrar los cambios actualizados
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    setMessage({ type: 'error', text: result.message });
                }
            } catch (error) {
                console.error('Error updating statuses:', error);
                setMessage({ type: 'error', text: 'Error al actualizar los estados' });
            }
        });
    };

    const handleToggleItemDelivery = (itemId: string, currentStatus: boolean) => {
        startTransition(async () => {
            try {
                const result = await updateItemDeliveryStatus(itemId, !currentStatus);
                if (result.success) {
                    setMessage({ type: 'success', text: 'Estado de entrega actualizado' });
                    // Forzar recarga de la página para mostrar los cambios actualizados
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    setMessage({ type: 'error', text: result.message });
                }
            } catch (error) {
                console.error('Error updating item delivery:', error);
                setMessage({ type: 'error', text: 'Error al actualizar el estado de entrega del ítem' });
            }
        });
    };

    const handleToggleAllItems = (delivered: boolean) => {
        startTransition(async () => {
            try {
                const result = await updateAllItemsDeliveryStatus(orderDetails.order_id, delivered);
                if (result.success) {
                    setMessage({ type: 'success', text: 'Estados de entrega actualizados' });
                    // Forzar recarga de la página para mostrar los cambios actualizados
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    setMessage({ type: 'error', text: result.message });
                }
            } catch (error) {
                console.error('Error updating all items delivery:', error);
                setMessage({ type: 'error', text: 'Error al actualizar el estado de entrega de todos los ítems' });
            }
        });
    };

    const handleSendWhatsApp = () => {
        if (!whatsappMessage.trim() || !orderDetails.customer_phone) return;
        
        startTransition(async () => {
            try {
                const result = await sendWhatsAppNotification(
                    orderDetails.customer_phone!, 
                    orderDetails.customer_name || 'Cliente', 
                    orderDetails.order_id
                );
                if (result.success) {
                    setMessage({ type: 'success', text: 'Notificación enviada exitosamente' });
                    setWhatsappMessage('');
                } else {
                    setMessage({ type: 'error', text: result.message });
                }
            } catch (error) {
                console.error('Error sending WhatsApp:', error);
                setMessage({ type: 'error', text: 'Error al enviar la notificación de WhatsApp' });
            }
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Mensaje de estado */}
                {message && (
                    <div className={`mb-4 p-4 rounded-md ${
                        message.type === 'success' 
                            ? 'bg-green-50 border border-green-200 text-green-800' 
                            : 'bg-red-50 border border-red-200 text-red-800'
                    }`}>
                        <div className="flex">
                            <div className="flex-shrink-0">
                                {message.type === 'success' ? (
                                    <CheckCircleIcon className="h-5 w-5 text-green-400" />
                                ) : (
                                    <div className="h-5 w-5 text-red-400">❌</div>
                                )}
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium">{message.text}</p>
                            </div>
                            <div className="ml-auto pl-3">
                                <button
                                    onClick={() => setMessage(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/admin/consulta"
                        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-4"
                    >
                        <ArrowLeftIcon className="mr-2 h-4 w-4" />
                        Volver a Consulta
                    </Link>
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Gestión de Orden #{orderDetails.order_id.slice(0, 8)}
                            </h1>
                            <p className="text-gray-600">
                                {new Date(orderDetails.order_date).toLocaleDateString('es-ES', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Link
                                href={`/admin/orders/${orderDetails.order_id}`}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <PrinterIcon className="mr-2 h-4 w-4" />
                                Imprimir Tickets
                            </Link>
                            <MultiCopyPrintButton
                                orderId={orderDetails.order_id}
                                orderHasEmbroidery={!!orderDetails.embroidery_notes}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700"
                                buttonText="Órdenes de Trabajo"
                                showIcons={false}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sección principal - Información y tabla */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Información del Cliente */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">Información del Cliente</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Cliente</label>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {orderDetails.customer_name || 'MOSTRADOR'}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Teléfono</label>
                                    <p className="text-lg font-medium text-gray-900">
                                        {orderDetails.customer_phone ? (
                                            <span className="text-blue-600 font-mono">{orderDetails.customer_phone}</span>
                                        ) : (
                                            <span className="text-gray-400">No proporcionado</span>
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Vendedor</label>
                                    <p className="text-lg font-medium text-gray-900">
                                        {orderDetails.seller_name || <span className="text-gray-400">N/A</span>}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Método de Pago</label>
                                    <p className="text-lg font-medium text-gray-900">
                                        {orderDetails.payment_method ? (
                                            <span className="bg-blue-50 text-blue-800 px-2 py-1 rounded text-sm font-semibold">
                                                {orderDetails.payment_method}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">No especificado</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                            
                            {orderDetails.school_name && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <label className="block text-sm font-medium text-gray-500">Escuela</label>
                                    <p className="text-lg font-semibold text-indigo-700 bg-indigo-50 p-3 rounded-md mt-1">
                                        🏫 {orderDetails.school_name}
                                    </p>
                                </div>
                            )}
                            
                            {orderDetails.embroidery_notes && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <label className="block text-sm font-medium text-gray-500">Notas de Bordado</label>
                                    <p className="text-sm font-medium text-gray-900 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-md mt-1">
                                        🪡 {orderDetails.embroidery_notes}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Items de la Orden */}
                        <div className="bg-white shadow rounded-lg overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-lg font-medium text-gray-900">Artículos del Pedido</h2>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleToggleAllItems(true)}
                                            disabled={isPending}
                                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 font-medium"
                                        >
                                            ✓ Marcar Todos Entregados
                                        </button>
                                        <button
                                            onClick={() => handleToggleAllItems(false)}
                                            disabled={isPending}
                                            className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 font-medium"
                                        >
                                            ○ Marcar Todos Pendientes
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Producto
                                            </th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Cantidad
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Precio Unit.
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Total
                                            </th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Estado de Entrega
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {orderDetails.items.map((item) => (
                                            <tr key={item.item_id} className={`${item.delivered ? 'bg-green-50' : 'bg-white'} hover:bg-gray-50`}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {item.product_name}
                                                        </div>
                                                        <div className="text-sm text-gray-600">
                                                            <span className="font-medium">{item.color}</span> - Talla <span className="font-medium">{item.size}</span>
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            SKU: {item.sku}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className="text-lg font-bold text-gray-900">{item.quantity}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <span className="text-sm font-medium text-gray-900">${item.price_at_sale.toFixed(2)}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <span className="text-sm font-bold text-gray-900">${(item.price_at_sale * item.quantity).toFixed(2)}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <button
                                                        onClick={() => handleToggleItemDelivery(item.item_id, item.delivered)}
                                                        disabled={isPending}
                                                        className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                                                            item.delivered
                                                                ? 'bg-green-100 text-green-800 border-2 border-green-200 hover:bg-green-200 shadow-sm'
                                                                : 'bg-red-50 text-red-700 border-2 border-red-200 hover:bg-red-100 shadow-sm'
                                                        } hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
                                                    >
                                                        {item.delivered ? (
                                                            <>
                                                                <CheckCircleIcon className="mr-2 h-4 w-4" />
                                                                ✓ Entregado
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="mr-2 h-4 w-4 rounded-full border-2 border-red-400 bg-white"></div>
                                                                ○ Pendiente
                                                            </>
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Panel lateral */}
                    <div className="space-y-6">
                        {/* Resumen de la Orden */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm font-medium text-gray-600">Subtotal:</span>
                                    <span className="text-sm font-bold text-gray-900">${orderDetails.subtotal.toFixed(2)}</span>
                                </div>
                                {orderDetails.discount_amount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-sm font-medium text-gray-600">
                                            Descuento ({orderDetails.discount_reason || 'General'}):
                                        </span>
                                        <span className="text-sm font-bold text-red-600">
                                            -${orderDetails.discount_amount.toFixed(2)}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold pt-3 border-t border-gray-200">
                                    <span className="text-gray-900">Total:</span>
                                    <span className="text-lg text-indigo-600">${orderDetails.order_total.toFixed(2)}</span>
                                </div>
                                
                                {orderDetails.is_layaway && (
                                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                                        <div className="text-center text-sm font-bold text-blue-700 bg-blue-50 p-2 rounded">
                                            🏦 SEPARADO
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Anticipo:</span>
                                            <span className="text-sm font-bold text-green-700">
                                                ${orderDetails.down_payment.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Saldo:</span>
                                            <span className={`text-sm font-bold ${
                                                orderDetails.remaining_balance > 0 ? 'text-red-600' : 'text-green-600'
                                            }`}>
                                                ${orderDetails.remaining_balance.toFixed(2)}
                                            </span>
                                        </div>
                                        {orderDetails.remaining_balance > 0 && (
                                            <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                                                <p className="text-xs text-yellow-800 font-medium text-center">
                                                    ⚠️ PENDIENTE COMPLETAR PAGO
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Estados de la Orden */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Estados de la Orden</h3>
                            
                            {/* Mostrar estados seleccionados */}
                            {selectedStatuses.length > 0 && (
                                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-xs font-medium text-blue-800 mb-2">Estados seleccionados:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {selectedStatuses.map(status => (
                                            <span key={status} className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                                {getStatusDisplayName(status)}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            <div className="space-y-3">
                                {AVAILABLE_STATUSES.map((status) => {
                                    const isChecked = selectedStatuses.includes(status);
                                    return (
                                        <label key={status} className="flex items-center cursor-pointer group hover:bg-gray-50 p-2 rounded-lg transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={(e) => handleStatusChange(status, e.target.checked)}
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                disabled={isPending}
                                            />
                                            <div className="ml-3 flex items-center">
                                                <span className={`text-sm px-3 py-1 rounded-full border font-medium ${getStatusColor(status)}`}>
                                                    {getStatusDisplayName(status)}
                                                </span>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                            <button
                                onClick={handleUpdateStatuses}
                                disabled={isPending || selectedStatuses.length === 0}
                                className="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 font-medium transition-colors"
                            >
                                {isPending ? 'Actualizando...' : 'Actualizar Estados'}
                            </button>
                        </div>

                        {/* WhatsApp Notifications */}
                        {orderDetails.customer_phone && (
                            <div className="bg-white shadow rounded-lg p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    <PhoneIcon className="inline h-5 w-5 mr-2 text-green-600" />
                                    Notificar Cliente
                                </h3>
                                <div className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                    <p className="text-sm font-bold text-green-800">
                                        📱 {orderDetails.customer_phone}
                                    </p>
                                    <p className="text-xs text-green-700 mt-1 font-medium">
                                        Cliente: {orderDetails.customer_name || 'Sin nombre'}
                                    </p>
                                </div>
                                <textarea
                                    value={whatsappMessage}
                                    onChange={(e) => setWhatsappMessage(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-md resize-none text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    rows={3}
                                    placeholder="Mensaje para el cliente..."
                                />
                                <button
                                    onClick={handleSendWhatsApp}
                                    disabled={isPending || !whatsappMessage.trim()}
                                    className="mt-3 w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 font-medium transition-colors"
                                >
                                    {isPending ? 'Enviando...' : '📱 Enviar WhatsApp'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
