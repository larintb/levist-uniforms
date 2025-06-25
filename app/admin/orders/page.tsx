// app/admin/orders/page.tsx
import { createClient } from "@/lib/supabase/server";
import Link from 'next/link';
import React from 'react';

export const dynamic = "force-dynamic";

// --- Type Definitions ---
interface User {
    full_name: string;
}

interface Order {
    id: string;
    created_at: string;
    customer_name: string | null;
    total: number;
    status: string | null;
    users: User | null;
}

// --- Componente para la Insignia de Estado (Badge) ---
const StatusBadge = ({ status }: { status: string | null }) => {
    const statusInfo = {
        COMPLETED: { text: 'Completado', color: 'bg-green-100 text-green-800 border border-green-200' },
        PENDING_EMBROIDERY: { text: 'Pendiente Bordado', color: 'bg-yellow-100 text-yellow-800 border border-yellow-200' },
        PENDING_SUPPLIER: { text: 'Pedido a Proveedor', color: 'bg-blue-100 text-blue-800 border border-blue-200' },
        READY_FOR_PICKUP: { text: 'Listo para Entrega', color: 'bg-indigo-100 text-indigo-800 border border-indigo-200' },
        DELIVERED: { text: 'Entregado', color: 'bg-gray-100 text-gray-800 border border-gray-200' },
    } as const;

    const currentStatus = statusInfo[status as keyof typeof statusInfo] || { text: status || 'Desconocido', color: 'bg-gray-100 text-gray-800 border border-gray-200' };

    return (
        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${currentStatus.color}`}>
            {currentStatus.text}
        </span>
    );
};

// --- Iconos (sin cambios) ---
const ChevronRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
);
const DocumentTextIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

// --- FUNCIÓN MEJORADA ---
// Ahora consultamos directamente la tabla 'orders' para obtener la cabecera,
// incluyendo el nuevo campo 'status'. Es más eficiente para esta vista de lista.
async function getOrders(): Promise<Order[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from('orders')
        .select('*, users(full_name)') // Hacemos un JOIN implícito con la tabla users
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
    return (data as Order[]) || [];
}

export default async function OrdersPage() {
    const orders = await getOrders();

    return (
        <div className="p-4 md:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Historial de Órdenes</h1>
                <p className="text-lg text-gray-700 mt-1">Aquí puedes ver y gestionar todas las ventas y pedidos.</p>
            </header>

            <main className="bg-white rounded-2xl shadow-lg ring-1 ring-gray-900/5">
                <div className="overflow-x-auto">
                    {orders.length > 0 ? (
                        <ul className="divide-y divide-gray-200">
                            {orders.map((order) => (
                                <li key={order.id}>
                                    <Link href={`/admin/orders/${order.id}`} className="block hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center p-4 sm:p-6">
                                            <div className="flex-shrink-0">
                                                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-700">
                                                    <DocumentTextIcon className="h-6 w-6"/>
                                                </div>
                                            </div>
                                            <div className="min-w-0 flex-1 ml-4 md:grid md:grid-cols-3 md:gap-4">
                                                <div>
                                                    <p className="text-sm font-bold text-indigo-600 truncate">
                                                        Orden #{order.id.slice(0, 8)}
                                                    </p>
                                                    <p className="mt-1 flex items-center text-sm text-gray-700 font-medium">
                                                        <span>{new Date(order.created_at).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                                    </p>
                                                </div>
                                                <div className="hidden md:block">
                                                    <p className="text-sm text-gray-900">
                                                        Cliente: <span className="font-semibold text-gray-800">{order.customer_name || 'Mostrador'}</span>
                                                    </p>
                                                    <p className="mt-1 text-sm text-gray-900">
                                                        Vendedor: <span className="font-semibold text-gray-800">{order.users?.full_name || 'N/A'}</span>
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-gray-900">
                                                        ${order.total.toFixed(2)}
                                                    </p>
                                                    <div className="mt-2">
                                                       <StatusBadge status={order.status} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="ml-5 flex-shrink-0">
                                                <ChevronRightIcon className="h-5 w-5 text-gray-600" />
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center py-12 px-6">
                            <h3 className="text-lg font-semibold text-gray-900">No hay órdenes registradas</h3>
                            <p className="mt-1 text-sm text-gray-700">
                                Cuando se complete una venta en el Punto de Venta, aparecerá aquí.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}