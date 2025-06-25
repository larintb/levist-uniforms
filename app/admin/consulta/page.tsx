"use client";

import React, { useState, useTransition, useRef, useEffect } from 'react';
import Link from 'next/link'; // Se importa Link para la navegación
import { searchProductByBarcode } from '@/app/admin/consulta/actions';
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
    price: string; // El tipo 'numeric' de Postgres se suele recibir como string
    brand: string;
    collection: string;
    category: string;
    barcode: string;
};

// --- Icono de Editar ---
const EditIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>;

// --- Componente de la Tarjeta de Producto ---
function ProductCard({ product }: { product: ProductDetails }) {
    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3">
                <div className="md:col-span-1 p-4 flex items-center justify-center bg-gray-50">
                    <img
                        src={product.image_url || 'https://placehold.co/300x300/f8f9fa/e9ecef?text=Sin+Imagen'}
                        alt={`Imagen de ${product.product_name}`}
                        className="max-h-60 w-auto object-contain rounded-lg"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/300x300/f8f9fa/e9ecef?text=Error'; }}
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


// --- Componente Principal de la Página ---
export default function ConsultaPage() {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [product, setProduct] = useState<ProductDetails | null>(null);
    const [wasSearched, setWasSearched] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Enfocar el input al cargar la página para que el escáner funcione de inmediato.
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSearch = (formData: FormData) => {
        const barcode = formData.get('barcode') as string;
        if (!barcode.trim()) {
            setError("Por favor, ingresa un código de barras.");
            setProduct(null);
            setWasSearched(false);
            return;
        }

        setError(null);
        setProduct(null);
        setWasSearched(true);

        startTransition(async () => {
            try {
                const result = await searchProductByBarcode(barcode.trim());
                if (result.success) {
                    setProduct(result.data as ProductDetails);
                } else {
                    // Handle undefined message by providing a fallback
                    setError(result.message || "Error desconocido al buscar el producto.");
                }
            } catch (error) {
                // Handle any unexpected errors
                console.error('Error inesperado:', error);
                setError("Error inesperado. Por favor, intenta de nuevo.");
            }
        });
    };
    
    return (
        <div className="p-4 md:p-8 w-full max-w-4xl mx-auto">
            <header className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Buscador de Productos</h1>
                <p className="text-gray-600 mt-2">Escanea o ingresa un código de barras para ver los detalles del producto.</p>
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
                        placeholder="Escanear código de barras..."
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
                    {!isPending && !error && product && (
                        <ProductCard product={product} />
                    )}
                    {!isPending && !error && !product && wasSearched && (
                         <div className="bg-white p-8 rounded-xl shadow-md text-center">
                            <h3 className="text-xl font-bold text-gray-800">Producto no encontrado</h3>
                            <p className="text-gray-500 mt-2">El código de barras no corresponde a ningún producto. Por favor, verifíquelo e intente de nuevo.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}