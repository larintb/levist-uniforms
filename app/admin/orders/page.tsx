import { createClient } from "@/lib/supabase/server";
import Link from 'next/link';
import React from 'react';

// Forzamos el renderizado dinámico para asegurar que la lista de órdenes esté siempre actualizada.
export const dynamic = "force-dynamic";

// --- Iconos para la UI ---
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


// --- ¡FUNCIÓN ACTUALIZADA! ---
// Ahora usamos la vista 'full_order_details' y procesamos los datos para obtener órdenes únicas.
async function getOrders() {
    const supabase = await createClient();
    
    // 1. Obtenemos todos los ítems de todas las órdenes desde la vista.
    const { data, error } = await supabase
        .from('full_order_details')
        .select('*')
        .order('order_date', { ascending: false });

    if (error) {
        console.error('Error fetching from full_order_details view:', error);
        return [];
    }

    if (!data) {
        return [];
    }
    
    // 2. Procesamos los resultados para obtener una lista de órdenes únicas.
    //    La vista devuelve una fila por cada ítem, así que las agrupamos por 'order_id'.
    const uniqueOrdersMap = new Map();
    
    data.forEach(item => {
        if (!uniqueOrdersMap.has(item.order_id)) {
            uniqueOrdersMap.set(item.order_id, {
                id: item.order_id,
                created_at: item.order_date,
                total: item.order_total,
                payment_method: item.payment_method,
                customer_name: item.customer_name,
                // Adaptamos la estructura para que coincida con lo que el componente espera
                users: { full_name: item.seller_name } 
            });
        }
    });

    // 3. Convertimos el mapa de vuelta a un array.
    return Array.from(uniqueOrdersMap.values());
}

// --- Componente de la Página ---
export default async function OrdersPage() {
    const orders = await getOrders();

    return (
        <div className="p-4 md:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Historial de Órdenes</h1>
                <p className="text-lg text-gray-600 mt-1">Aquí puedes ver todas las ventas registradas en el sistema.</p>
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
                                                <div className={`flex items-center justify-center h-12 w-12 rounded-full ${ order.payment_method === 'Efectivo' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    <DocumentTextIcon className="h-6 w-6"/>
                                                </div>
                                            </div>
                                            <div className="min-w-0 flex-1 ml-4 md:grid md:grid-cols-3 md:gap-4">
                                                <div>
                                                    <p className="text-sm font-bold text-indigo-600 truncate">
                                                        Orden #{order.id.slice(0, 8)}
                                                    </p>
                                                    <p className="mt-1 flex items-center text-sm text-gray-500">
                                                        <span>{new Date(order.created_at).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                                    </p>
                                                </div>
                                                <div className="hidden md:block">
                                                    <div>
                                                        <p className="text-sm text-gray-900">
                                                            Cliente: <span className="font-medium">{order.customer_name || 'Mostrador'}</span>
                                                        </p>
                                                        <p className="mt-1 text-sm text-gray-500">
                                                            Vendedor: <span className="font-medium">{(order.users as any)?.full_name || 'N/A'}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                 <div className="text-right">
                                                    <p className="text-lg font-semibold text-gray-900">
                                                        ${(order.total as number).toFixed(2)}
                                                    </p>
                                                     <p className="mt-1 text-sm">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                            order.payment_method === 'Efectivo' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                                        }`}>
                                                            {order.payment_method || 'N/A'}
                                                        </span>
                                                     </p>
                                                </div>
                                            </div>
                                            <div className="ml-5 flex-shrink-0">
                                                <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center py-12 px-6">
                            <h3 className="text-lg font-medium text-gray-900">No hay órdenes registradas</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Cuando se complete una venta en el Punto de Venta, aparecerá aquí.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
