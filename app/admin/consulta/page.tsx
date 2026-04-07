"use client";

import React, { useState, useTransition, useRef, useEffect } from 'react';
import Link from 'next/link';
import { searchAction, addInventoryEntryAction, updateInventoryItemPrice, updateInventoryStock } from '@/app/admin/consulta/actions';
import Image from 'next/image';
import toast, { Toaster } from 'react-hot-toast';

// --- Tipos de Datos ---
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

// --- Tipo para el resultado de búsqueda ---
type SearchResultData = {
    type: 'product' | 'order';
    data: ProductDetails | OrderDetails;
};

// --- Tipo para items de auditoría ---
type AuditItem = {
    inventory_id: string;
    product_name: string;
    sku: string;
    color: string;
    size: string;
    barcode: string;
    image_url: string | null;
    stock_sistema: number;
    conteo_fisico: number;
};

// --- Nuevo tipo para el modo de la página ---
type PageMode = 'consulta' | 'entrada' | 'auditoria';

// --- Icono de Editar ---
const EditIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
);

// --- Sub-componente: Editor de Stock inline ---
type StockSaveState = 'idle' | 'saving' | 'success' | 'error';

function StockEditor({ inventoryId, initialStock, onStockChange }: { inventoryId: string; initialStock: number; onStockChange: (newStock: number) => void }) {
    const [localStock, setLocalStock] = useState(initialStock);
    const [inputValue, setInputValue] = useState(String(initialStock));
    const [saveState, setSaveState] = useState<StockSaveState>('idle');
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const commit = async () => {
        const parsed = parseInt(inputValue, 10);
        if (isNaN(parsed) || parsed < 0 || parsed === localStock) {
            setInputValue(String(localStock)); // revertir si inválido o sin cambio
            return;
        }
        setSaveState('saving');
        const result = await updateInventoryStock(inventoryId, parsed);
        if (result.success) {
            setLocalStock(parsed);
            onStockChange(parsed);
            setSaveState('success');
            timerRef.current = setTimeout(() => setSaveState('idle'), 1800);
        } else {
            setInputValue(String(localStock)); // revertir
            setSaveState('error');
            timerRef.current = setTimeout(() => setSaveState('idle'), 2500);
        }
    };

    useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

    const textColor = localStock > 0 ? 'text-green-600' : 'text-red-600';
    const ringColor =
        saveState === 'success' ? 'ring-2 ring-green-400' :
        saveState === 'error'   ? 'ring-2 ring-red-400'   :
        'ring-1 ring-gray-300 focus:ring-2 focus:ring-indigo-500';

    return (
        <div className="mt-1 flex items-center gap-2">
            <input
                type="number"
                min={0}
                value={inputValue}
                disabled={saveState === 'saving'}
                onChange={e => setInputValue(e.target.value)}
                onFocus={e => e.target.select()}
                onBlur={commit}
                onKeyDown={e => { if (e.key === 'Enter') { e.currentTarget.blur(); } }}
                className={`w-20 text-lg font-semibold rounded-md px-2 py-0.5 bg-transparent border-0 outline-none transition-all ${textColor} ${ringColor} disabled:opacity-60 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
            />
            <span className="text-sm text-gray-400">un.</span>
            {saveState === 'saving' && (
                <svg className="animate-spin h-4 w-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
            )}
            {saveState === 'success' && (
                <svg className="h-4 w-4 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd"/>
                </svg>
            )}
            {saveState === 'error' && (
                <svg className="h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd"/>
                </svg>
            )}
        </div>
    );
}

// --- Componente de la Tarjeta de Producto ---
function ProductCard({ product, onStockChange }: { product: ProductDetails; onStockChange: (newStock: number) => void }) {
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
                    />
                </div>
                <div className="md:col-span-2 p-6 md:p-8">
                    <div className="flex justify-between items-start mb-2">
                        <span className="inline-block bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                            {product.category}
                        </span>
                        <Link
                            href={`/admin/products/${product.product_id}/edit`}
                            title="Editar Producto"
                            className="p-2 text-gray-400 rounded-full hover:bg-gray-100 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        >
                            <EditIcon className="h-5 w-5" />
                        </Link>
                    </div>
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
                                <StockEditor inventoryId={product.inventory_id} initialStock={product.stock} onStockChange={onStockChange} />
                            </div>
                            <div className="col-span-2">
                                <dt className="text-sm font-medium text-gray-500">Precio</dt>
                                <dd className="mt-1 text-2xl font-bold text-indigo-600">
                                    ${parseFloat(product.price).toFixed(2)}
                                </dd>
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
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
}

// --- Componente de la Tarjeta de Orden ---
function OrderCard({ order }: { order: OrderDetails }) {
    const getStatusChipClass = (status: string): string => {
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
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start gap-3">
                        <div>
                            <p className="text-sm font-medium text-indigo-600">Detalles de la Orden</p>
                            <h2 className="text-2xl font-bold text-gray-900 break-all">
                                #{order.order_id.substring(0, 8)}...
                            </h2>
                        </div>
                        <div className="flex flex-col gap-1">
                            {order.embroidery_notes && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    🪡 Bordado
                                </span>
                            )}
                            {order.school_name && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    🏫 Escuela
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className={`inline-block text-sm font-semibold px-3 py-1 rounded-full ${getStatusChipClass(order.order_status)}`}>
                            {order.order_status}
                        </span>
                        <Link
                            href={`/admin/orders/${order.order_id}/manage`}
                            title="Gestionar Orden"
                            className="p-2 text-gray-400 rounded-full hover:bg-gray-100 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        >
                            <EditIcon className="h-5 w-5" />
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 border-t border-gray-200 pt-6">
                    <div className="col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Fecha</dt>
                        <dd className="mt-1 text-md text-gray-900">
                            {new Date(order.order_date).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                            })}
                        </dd>
                        <dd className="text-xs text-gray-500">
                            {new Date(order.order_date).toLocaleDateString('es-ES', {
                                weekday: 'long'
                            })}
                        </dd>
                    </div>
                    <div className="col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Cliente</dt>
                        <dd className="mt-1 text-md font-semibold text-gray-900">{order.customer_name || 'MOSTRADOR'}</dd>
                        {order.customer_phone && (
                            <dd className="text-xs text-gray-500">{order.customer_phone}</dd>
                        )}
                    </div>
                    <div className="col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Vendedor</dt>
                        <dd className="mt-1 text-md text-gray-900">{order.seller_name || 'N/A'}</dd>
                        {order.payment_method && (
                            <dd className="text-xs text-gray-500">{order.payment_method}</dd>
                        )}
                    </div>
                </div>

                <div className="mt-8">
                    <h3 className="text-lg font-bold text-gray-800">Artículos del Pedido</h3>
                    <ul role="list" className="mt-4 border-t border-b border-gray-200 divide-y divide-gray-200">
                        {order.items.map((item) => (
                            <li key={item.item_id} className="flex py-4">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{item.product_name}</p>
                                    <p className="text-sm text-gray-500 truncate">
                                        {item.sku} - {item.color} / {item.size}
                                    </p>
                                </div>
                                <div className="inline-flex items-center text-base font-semibold text-gray-900">
                                    {item.quantity} x ${parseFloat(item.price_at_sale).toFixed(2)}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                
                <div className="flex justify-between items-end mt-6 pt-6 border-t border-gray-200">
                    <div>
                        {order.embroidery_notes && (
                            <p className="text-sm text-gray-600">
                                <span className="text-gray-600 font-bold">Notas de bordado:</span> {order.embroidery_notes}
                            </p>
                        )}
                        {order.school_name && (
                            <p className="text-sm text-gray-600">
                                <span className="font-bold">Colegio:</span> {order.school_name}
                            </p>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Total de la Orden</p>
                        <p className="text-3xl font-bold text-indigo-600">
                            ${parseFloat(order.order_total).toFixed(2)}
                        </p>
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
    const [searchResult, setSearchResult] = useState<SearchResultData | null>(null);
    const [wasSearched, setWasSearched] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // --- Estados para el modo de entrada de inventario ---
    const [mode, setMode] = useState<PageMode>('consulta');
    const [scannedProducts, setScannedProducts] = useState<ProductDetails[]>([]);
    const [entrySuccess, setEntrySuccess] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Estados para el modo de auditoría ---
    const [auditItems, setAuditItems] = useState<AuditItem[]>([]);

    useEffect(() => {
        inputRef.current?.focus();
    }, [mode]); // Re-enfocar al cambiar de modo

    const handleSearch = (formData: FormData) => {
        const term = formData.get('barcode') as string;
        if (!term.trim()) {
            setError("Por favor, ingresa un código.");
            setSearchResult(null);
            setWasSearched(false);
            return;
        }

        setError(null);
        setEntrySuccess(null);
        setSearchResult(null);
        setWasSearched(true);

        startTransition(async () => {
            const result = await searchAction(term.trim());

            if (mode === 'consulta') {
                if (result.success && result.data && result.type) {
                    setSearchResult({ type: result.type, data: result.data });
                } else {
                    setError(result.message || "No se encontró un resultado.");
                }
            } else if (mode === 'entrada') {
                if (result.success && result.type === 'product' && result.data) {
                    const product = result.data as ProductDetails;
                    if (scannedProducts.length < 20) {
                        setScannedProducts(prev => [product, ...prev]);
                    } else {
                        setError("Se ha alcanzado el límite de 20 productos por entrada.");
                    }
                } else {
                    setError(result.message || "Producto no encontrado o código no válido.");
                }
            } else { // modo 'auditoria'
                if (result.success && result.type === 'product' && result.data) {
                    const product = result.data as ProductDetails;
                    setAuditItems(prev => {
                        const existing = prev.find(item => item.inventory_id === product.inventory_id);
                        if (existing) {
                            return prev.map(item =>
                                item.inventory_id === product.inventory_id
                                    ? { ...item, conteo_fisico: item.conteo_fisico + 1 }
                                    : item
                            );
                        }
                        return [{
                            inventory_id: product.inventory_id,
                            product_name: product.product_name,
                            sku: product.sku,
                            color: product.color,
                            size: product.size,
                            barcode: product.barcode,
                            image_url: product.image_url,
                            stock_sistema: product.stock,
                            conteo_fisico: 1,
                        }, ...prev];
                    });
                } else {
                    setError(result.message || "Producto no encontrado.");
                }
            }

            // Re-enfocar el input tras cada escaneo
            inputRef.current?.focus();
        });
        // Limpiar el input después de cada escaneo
        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };

    const handleSaveEntry = () => {
        if (scannedProducts.length === 0) {
            setError("No hay productos en la lista para guardar.");
            return;
        }
        setError(null);
        setEntrySuccess(null);
        setIsSubmitting(true);

        startTransition(async () => {
            // 1. Actualizar todos los precios primero
            const priceUpdatePromises = scannedProducts.map(p => 
                updateInventoryItemPrice(p.inventory_id, parseFloat(p.price))
            );

            try {
                const results = await Promise.all(priceUpdatePromises);
                const failedUpdate = results.find(res => !res.success);

                if (failedUpdate) {
                    toast.error(`Error al actualizar precio: ${failedUpdate.message}`);
                    setError("No se pudo actualizar el precio de uno o más productos. La entrada no fue guardada.");
                    setIsSubmitting(false);
                    return;
                }
                
                toast.success('Todos los precios se actualizaron correctamente.');

                // 2. Si todos los precios se actualizan, guardar la entrada de inventario
                const inventoryIds = scannedProducts.map(p => p.inventory_id);
                const result = await addInventoryEntryAction(inventoryIds);

                if (result.success) {
                    setEntrySuccess(result.message || "Entrada de inventario guardada con éxito.");
                    setScannedProducts([]); // Limpiar lista
                } else {
                    setError(result.message || "Error al guardar la entrada de inventario.");
                }
            } catch (e) {
                const error = e as Error;
                setError(`Ocurrió un error inesperado: ${error.message}`);
                toast.error('Ocurrió un error inesperado al guardar los datos.');
            } finally {
                setIsSubmitting(false);
            }
        });
    };

    const handleRemoveProduct = (inventoryId: string) => {
        setScannedProducts(prev => prev.filter(p => p.inventory_id !== inventoryId));
    };
    
    return (
        <div className="p-4 md:p-8 w-full max-w-4xl mx-auto">
            <Toaster position="bottom-center" />
            <header className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Centro de Operaciones</h1>
                <p className="text-gray-600 mt-2">
                    {mode === 'consulta'
                        ? "Escanea un código de barras de producto o un código QR de orden para ver detalles."
                        : mode === 'entrada'
                        ? "Escanea productos para registrarlos en el inventario."
                        : "Escanea productos para validar el conteo físico contra el stock del sistema."}
                </p>
            </header>

            {/* Selector de Modo */}
            <div className="mb-6 flex justify-center bg-gray-200 rounded-lg p-1">
                <button
                    onClick={() => setMode('consulta')}
                    className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${mode === 'consulta' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600 hover:bg-gray-300'}`}
                >
                    Modo Consulta
                </button>
                <button
                    onClick={() => setMode('entrada')}
                    className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${mode === 'entrada' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600 hover:bg-gray-300'}`}
                >
                    Entrada de Inventario
                </button>
                <button
                    onClick={() => { setMode('auditoria'); setAuditItems([]); setError(null); }}
                    className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${mode === 'auditoria' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600 hover:bg-gray-300'}`}
                >
                    Auditoría
                </button>
            </div>

            <main>
                <form action={handleSearch} className="relative flex items-center">
                    <svg className="absolute left-4 h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5A.75.75 0 0 1 4.5 3.75h15a.75.75 0 0 1 .75.75v15a.75.75 0 0 1-.75-.75h-15a.75.75 0 0 1-.75-.75v-15Zm3.75 3a.75.75 0 0 0-1.5 0v9a.75.75 0 0 0 1.5 0v-9Zm3.75 0a.75.75 0 0 0-1.5 0v9a.75.75 0 0 0 1.5 0v-9Zm3.75 0a.75.75 0 0 0-1.5 0v9a.75.75 0 0 0 1.5 0v-9Z" />
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        name="barcode"
                        id="barcode-input"
                        placeholder={mode === 'consulta' ? "Escanear código de producto u orden..." : mode === 'entrada' ? "Escanear producto para agregar..." : "Escanear producto para auditar..."}
                        className="text-gray-600 w-full pl-12 pr-32 py-4 text-lg bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-gray-600"
                        autoComplete="off"
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
                            <span className="text-gray-600">Buscando...</span>
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg" role="alert">
                            <p className="font-bold">Ocurrió un error</p>
                            <p>{error}</p>
                        </div>
                    )}
                    {entrySuccess && (
                        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg" role="alert">
                            <p className="font-bold">Éxito</p>
                            <p>{entrySuccess}</p>
                        </div>
                    )}

                    {/* --- VISTA DE CONSULTA --- */}
                    {mode === 'consulta' && !isPending && !error && searchResult && (
                        <>
                            {searchResult.type === 'product' && (
                                <ProductCard
                                    product={searchResult.data as ProductDetails}
                                    onStockChange={(newStock) =>
                                        setSearchResult(prev =>
                                            prev && prev.type === 'product'
                                                ? { ...prev, data: { ...(prev.data as ProductDetails), stock: newStock } }
                                                : prev
                                        )
                                    }
                                />
                            )}
                            {searchResult.type === 'order' && (
                                <OrderCard order={searchResult.data as OrderDetails} />
                            )}
                        </>
                    )}
                    {mode === 'consulta' && !isPending && !error && !searchResult && wasSearched && (
                        <div className="bg-white p-8 rounded-xl shadow-md text-center">
                            <h3 className="text-xl font-bold text-gray-800">No se encontraron resultados</h3>
                            <p className="text-gray-500 mt-2">
                                El código no corresponde a ningún producto u orden. Por favor, verifíquelo e intente de nuevo.
                            </p>
                        </div>
                    )}

                    {/* --- VISTA DE ENTRADA DE INVENTARIO --- */}
                    {mode === 'entrada' && (
                        <div className="mt-8">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-800">Productos Escaneados ({scannedProducts.length}/20)</h2>
                                <button
                                    onClick={handleSaveEntry}
                                    disabled={isSubmitting || scannedProducts.length === 0}
                                    className="bg-green-600 text-white font-semibold py-2 px-5 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 disabled:bg-green-400 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Guardando...' : 'Guardar Entrada'}
                                </button>
                            </div>
                            <div className="bg-white rounded-xl shadow-md">
                                <ul className="divide-y divide-gray-200">
                                    {scannedProducts.length > 0 ? (
                                        scannedProducts.map((p, index) => (
                                            <li key={`${p.inventory_id}-${index}`} className="p-4 grid grid-cols-12 gap-4 items-center">
                                                <div className="col-span-6 flex items-center">
                                                    <Image
                                                        src={p.image_url || 'https://placehold.co/100x100/f8f9fa/e9ecef?text=Sin+Imagen'}
                                                        alt={p.product_name}
                                                        width={50}
                                                        height={50}
                                                        className="rounded-md mr-4"
                                                    />
                                                    <div>
                                                        <p className="font-semibold text-gray-800">{p.product_name}</p>
                                                        <p className="text-sm text-gray-500">{p.sku} - {p.color} / {p.size}</p>
                                                    </div>
                                                </div>
                                                <div className="col-span-4">
                                                    <label htmlFor={`price-${p.inventory_id}`} className="sr-only">Precio</label>
                                                    <div className="relative">
                                                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
                                                        <input 
                                                            type="number"
                                                            id={`price-${p.inventory_id}`}
                                                            value={p.price}
                                                            onChange={(e) => {
                                                                const newPrice = e.target.value;
                                                                setScannedProducts(prev => 
                                                                    prev.map(prod => prod.inventory_id === p.inventory_id ? { ...prod, price: newPrice } : prod)
                                                                );
                                                            }}
                                                            className="w-full pl-7 pr-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900"
                                                            step="1"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-span-2 text-right">
                                                    <button
                                                        onClick={() => handleRemoveProduct(p.inventory_id)}
                                                        className="text-red-500 hover:text-red-700 font-semibold"
                                                        title="Quitar de la lista"
                                                    >
                                                        Quitar
                                                    </button>
                                                </div>
                                            </li>
                                        ))
                                    ) : (
                                        <li className="p-8 text-center text-gray-500">
                                            Aún no se han escaneado productos.
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    )}
                    {/* --- VISTA DE AUDITORÍA --- */}
                    {mode === 'auditoria' && (
                        <div className="mt-8">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-800">
                                    Auditoría de Inventario
                                    {auditItems.length > 0 && (
                                        <span className="ml-2 text-sm font-normal text-gray-500">
                                            ({auditItems.length} producto{auditItems.length !== 1 ? 's' : ''})
                                        </span>
                                    )}
                                </h2>
                                {auditItems.length > 0 && (
                                    <button
                                        onClick={() => { setAuditItems([]); setError(null); }}
                                        className="text-sm text-red-500 hover:text-red-700 font-medium"
                                    >
                                        Limpiar todo
                                    </button>
                                )}
                            </div>

                            {auditItems.length === 0 ? (
                                <div className="bg-white rounded-xl shadow-md p-10 text-center text-gray-500">
                                    <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" />
                                    </svg>
                                    <p>Escanea el primer producto para iniciar la auditoría.</p>
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                                    <ul className="divide-y divide-gray-100">
                                        {auditItems.map((item) => {
                                            const isExact = item.conteo_fisico === item.stock_sistema;
                                            const isOver = item.conteo_fisico > item.stock_sistema;
                                            const counterColor = isOver
                                                ? 'text-red-600 bg-red-50 border-red-200'
                                                : isExact
                                                ? 'text-green-600 bg-green-50 border-green-200'
                                                : 'text-gray-700 bg-gray-50 border-gray-200';
                                            const counterLabel = isOver ? 'Excede' : isExact ? 'Coincide' : 'Contando...';

                                            return (
                                                <li key={item.inventory_id} className="p-4 flex items-center gap-4">
                                                    <Image
                                                        src={item.image_url || 'https://placehold.co/56x56/f8f9fa/e9ecef?text=?'}
                                                        alt={item.product_name}
                                                        width={56}
                                                        height={56}
                                                        className="rounded-lg object-cover flex-shrink-0 bg-gray-100"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-gray-900 truncate">{item.product_name}</p>
                                                        <p className="text-sm text-gray-500">{item.sku} · {item.color} / {item.size}</p>
                                                        <p className="text-xs text-gray-400 font-mono mt-0.5">{item.barcode}</p>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                        <div className={`flex items-center gap-1.5 border rounded-lg px-3 py-1.5 font-bold text-lg tabular-nums ${counterColor}`}>
                                                            <span>{item.conteo_fisico}</span>
                                                            <span className="text-sm font-normal opacity-60">/</span>
                                                            <span>{item.stock_sistema}</span>
                                                        </div>
                                                        <span className={`text-xs font-medium ${isOver ? 'text-red-500' : isExact ? 'text-green-500' : 'text-gray-400'}`}>
                                                            {counterLabel}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => setAuditItems(prev => prev.filter(i => i.inventory_id !== item.inventory_id))}
                                                        className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 ml-1"
                                                        title="Quitar de la auditoría"
                                                    >
                                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>

                                    {/* Resumen de auditoría */}
                                    <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 flex gap-4 text-sm">
                                        <span className="text-green-600 font-medium">
                                            ✓ {auditItems.filter(i => i.conteo_fisico === i.stock_sistema).length} coinciden
                                        </span>
                                        <span className="text-red-500 font-medium">
                                            ↑ {auditItems.filter(i => i.conteo_fisico > i.stock_sistema).length} exceden
                                        </span>
                                        <span className="text-gray-400 font-medium">
                                            ◷ {auditItems.filter(i => i.conteo_fisico < i.stock_sistema).length} pendientes
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}