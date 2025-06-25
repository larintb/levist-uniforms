"use client";

import React, { useState, useTransition, useRef, useEffect } from 'react';
import Link from 'next/link'; // Se importa Link para la navegación
import { searchAction } from '@/app/admin/consulta/actions';
import Image from 'next/image';
// --- Tipos de Datos ---
// Idealmente, este tipo se generaría desde la base de datos (con 'supabase gen types')
// y se importaría para garantizar la coherencia.
type ProductDetails = {
    inventory_id: string;
    product_id: string;
    product_name: string;
    is_available: boolean;
    color: string;
    image_url: string | null;
    sku: string;
    size: string;
    stock: number;
    price: string;
    brand: string;
    collection: string;
    category: string;
    barcode: string;
};

type OrderDetails = {
    order_id: string;
    order_date: string;
    order_total: string;
    order_status: string;
    payment_method: string;
    seller_name: string;
    customer_name: string;
    customer_phone: string;
    embroidery_notes: string | null;
    school_name: string | undefined;
    items: {
        item_id: string;
        product_name: string;
        sku: string;
        color: string;
        size: string;
        quantity: number;
        price_at_sale: string;
    }[];
};

// --- Icono de Editar ---
const EditIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>;

// --- Componente de la Tarjeta de Producto ---
function ProductCard({ product }: { product: ProductDetails }) {
    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3">
                <div className="md:col-span-1 p-4 flex items-center justify-center bg-gray-50">
                    <Image
                        src={product.image_url || 'https://placehold.co/300x300/f8f9fa/e9ecef?text=Sin+Imagen'}
                        alt={`Imagen de ${product.product_name}`}
                        width={300}
                        height={300}
                        className="max-h-60 w-auto object-contain rounded-lg"
                        // El onError no funciona igual, pero Next.js tiene manejo de errores de imagen incorporado.
                        // Si necesitas un fallback, hay estrategias más avanzadas con un estado local.
                    />
                </div>
                <div className="md:col-span-2 p-6 md:p-8">
                    {/* -- INICIO DE CAMBIO: Botón de Editar -- */}
                    <div className="flex justify-between items-start mb-2">
                        <span className="inline-block bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">{product.category}</span>
                        <Link
                            href={`/admin/products/${product.product_id}/edit`}
                            title="Editar Producto"
                            className="p-2 text-gray-400 rounded-full hover:bg-gray-100 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        >
                            <EditIcon className="h-5 w-5" />
                        </Link>
                    </div>
                    {/* -- FIN DE CAMBIO -- */}
                    <h2 className="text-2xl font-bold text-gray-900">{product.product_name}</h2>
                    <p className="text-gray-500 mb-4">{product.brand} - {product.collection}</p>

                    <div className="mt-6 border-t border-gray-200 pt-6">
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-6">
                            <div className="col-span-1">
                                <dt className="text-sm font-medium text-gray-500">SKU</dt>
                                <dd className="mt-1 text-lg font-semibold text-gray-900">{product.sku}</dd>
                            </div>
                            <div className="col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Color</dt>
                                <dd className="mt-1 text-lg font-semibold text-gray-900">{product.color}</dd>
                            </div>
                            <div className="col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Talla</dt>
                                <dd className="mt-1 text-lg font-semibold text-gray-900">{product.size}</dd>
                            </div>
                            <div className="col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Stock</dt>
                                <dd className={`mt-1 text-lg font-semibold ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>{product.stock} unidades</dd>
                            </div>
                            <div className="col-span-2">
                                <dt className="text-sm font-medium text-gray-500">Precio</dt>
                                <dd className="mt-1 text-2xl font-bold text-indigo-600">${parseFloat(product.price).toFixed(2)}</dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
            <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
            `}</style>
        </div>
    );
}


// --- Icono de Documento (para la orden) ---
const DocumentIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>

// --- Componente de la Tarjeta de Orden ---
function OrderCard({ order }: { order: OrderDetails }) {
    
    // Función para dar color al estado de la orden
    const getStatusChipClass = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completado':
                return 'bg-green-100 text-green-800';
            case 'pendiente':
                return 'bg-yellow-100 text-yellow-800';
            case 'cancelado':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 animate-fade-in">
            <div className="p-6 md:p-8">
                {/* --- INICIO DE CAMBIO: Contenedor del encabezado actualizado --- */}
                <div className="flex justify-between items-start mb-4">
                    {/* Título de la orden */}
                    <div>
                        <p className="text-sm font-medium text-indigo-600">Detalles de la Orden</p>
                        <h2 className="text-2xl font-bold text-gray-900 break-all">#{order.order_id.substring(0, 8)}...</h2>
                    </div>

                    {/* Contenedor para el estado y el botón */}
                    <div className="flex items-center space-x-2">
                         <span className={`inline-block text-sm font-semibold px-3 py-1 rounded-full ${getStatusChipClass(order.order_status)}`}>
                            {order.order_status}
                        </span>
                        <Link
                            href={`/admin/orders/${order.order_id}`}
                            title="Gestionar Orden"
                            className="p-2 text-gray-400 rounded-full hover:bg-gray-100 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        >
                            <EditIcon className="h-5 w-5" />
                        </Link>
                    </div>
                </div>
                {/* --- FIN DE CAMBIO --- */}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 border-t border-gray-200 pt-6">
                    <div className="col-span-1"><dt className="text-sm font-medium text-gray-500">Fecha</dt><dd className="mt-1 text-md text-gray-900">{new Date(order.order_date).toLocaleDateString()}</dd></div>
                    <div className="col-span-1"><dt className="text-sm font-medium text-gray-500">Cliente</dt><dd className="mt-1 text-md text-gray-900">{order.customer_name}</dd></div>
                    <div className="col-span-1"><dt className="text-sm font-medium text-gray-500">Vendedor</dt><dd className="mt-1 text-md text-gray-900">{order.seller_name}</dd></div>
                </div>

                <div className="mt-8">
                    <h3 className="text-lg font-bold text-gray-800">Artículos del Pedido</h3>
                    <ul role="list" className="mt-4 border-t border-b border-gray-200 divide-y divide-gray-200">
                        {order.items.map((item) => (
                            <li key={item.item_id} className="flex py-4">
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-800">{item.product_name}</p>
                                    <p className="text-sm text-gray-500">{item.size} - {item.color} (SKU: {item.sku})</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-gray-800">${parseFloat(item.price_at_sale).toFixed(2)}</p>
                                    <p className="text-sm text-gray-500">Cant: {item.quantity}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                
                <div className="flex justify-between items-end mt-6 pt-6 border-t border-gray-200">
                    <div>
                        {order.embroidery_notes && <p className="text-sm text-gray-600"><span className="font-bold">Notas de bordado:</span> {order.embroidery_notes}</p>}
                        {order.school_name && <p className="text-sm text-gray-600"><span className="font-bold">Colegio:</span> {order.school_name}</p>}
                    </div>
                     <div className="text-right">
                        <p className="text-sm text-gray-500">Total de la Orden</p>
                        <p className="text-3xl font-bold text-indigo-600">${parseFloat(order.order_total).toFixed(2)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}


// --- Componente Principal de la Página ---
export default function ConsultaPage() {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    // CAMBIO: Estado unificado para el resultado de la búsqueda
    const [searchResult, setSearchResult] = useState<{ type: 'product' | 'order'; data: ProductDetails | OrderDetails } | null>(null);
    const [wasSearched, setWasSearched] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSearch = (formData: FormData) => {
        const term = formData.get('barcode') as string; // El campo se sigue llamando 'barcode' en el form
        if (!term.trim()) {
            setError("Por favor, ingresa un código.");
            setSearchResult(null);
            setWasSearched(false);
            return;
        }

        setError(null);
        setSearchResult(null);
        setWasSearched(true);

        startTransition(async () => {
            const result = await searchAction(term.trim());
            if (result.success && result.data && result.type) {
                // El 'as any' aquí es un pequeño truco para satisfacer a TypeScript
                // ya que hemos validado que los datos existen. Es seguro en este contexto.
                setSearchResult({ type: result.type, data: result.data as any });
            } else {
                setError(result.message || "No se encontró un resultado.");
            }
        });
    };
    
    return (
        <div className="p-4 md:p-8 w-full max-w-4xl mx-auto">
            <header className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Centro de Consultas</h1>
                <p className="text-gray-600 mt-2">Escanea un código de barras de producto o un código QR de orden.</p>
            </header>

            <main>
                <form action={handleSearch} className="relative flex items-center">
                    <svg className="absolute left-4 h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5A.75.75 0 0 1 4.5 3.75h15a.75.75 0 0 1 .75.75v15a.75.75 0 0 1-.75.75h-15a.75.75 0 0 1-.75-.75v-15Zm3.75 3a.75.75 0 0 0-1.5 0v9a.75.75 0 0 0 1.5 0v-9Zm3.75 0a.75.75 0 0 0-1.5 0v9a.75.75 0 0 0 1.5 0v-9Zm3.75 0a.75.75 0 0 0-1.5 0v9a.75.75 0 0 0 1.5 0v-9Z" />
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        name="barcode"
                        id="barcode-input"
                        placeholder="Escanear código de producto u orden..."
                        className="w-full pl-12 pr-32 py-4 text-lg bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-gray-600"
                    />
                    <button
                        type="submit"
                        disabled={isPending}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                    >
                        {isPending ? 'Buscando...' : 'Buscar'}
                    </button>
                </form>

                <div id="results-container" className="mt-8">
                    {isPending && (
                        <div className="flex justify-center items-center p-8">
                             <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-gray-600">Buscando en el inventario...</span>
                        </div>
                    )}
                    {error && (
                         <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg" role="alert">
                            <p className="font-bold">Ocurrió un error</p>
                            <p>{error}</p>
                        </div>
                    )}
                    {!isPending && !error && searchResult && (
                        <>
                            {searchResult.type === 'product' && <ProductCard product={searchResult.data as ProductDetails} />}
                            {searchResult.type === 'order' && <OrderCard order={searchResult.data as OrderDetails} />}
                        </>
                    )}

                    {!isPending && !error && !searchResult && wasSearched && (
                         <div className="bg-white p-8 rounded-xl shadow-md text-center">
                             <h3 className="text-xl font-bold text-gray-800">No se encontraron resultados</h3>
                             <p className="text-gray-500 mt-2">El código no corresponde a ningún producto u orden. Por favor, verifíquelo e intente de nuevo.</p>
                         </div>
                    )}
                </div>
            </main>
        </div>
    );
}