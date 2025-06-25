"use client";

import React, { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // ¡NUEVO! Importamos el router
import { findProductByBarcode, processSale } from './actions';
import { PosCart } from '@/components/admin/PosCart'; 

// --- Tipos de Datos ---
export type CartItem = {
    inventory_id: string;
    product_id: string;
    name: string;
    image_url: string | null;
    size: string;
    color: string;
    price: number;
    stock: number;
    barcode: string;
    quantity: number;
};

// --- Iconos ---
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;

// --- Componente Principal de la Página POS ---
export default function PosPage() {
    const [isProcessing, startTransition] = useTransition();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const barcodeInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter(); // ¡NUEVO! Inicializamos el router

    useEffect(() => {
        barcodeInputRef.current?.focus();
    }, []);

    const handleSearch = (formData: FormData) => {
        // ... (La lógica de búsqueda no cambia)
        const barcode = formData.get('barcode') as string;
        if (!barcode.trim()) return;
        setError(null);
        startTransition(async () => {
            const result = await findProductByBarcode(barcode.trim());
            if (barcodeInputRef.current) barcodeInputRef.current.value = "";
            if (!result.success || !result.data) {
                setError(result.message || "Producto no encontrado.");
                setTimeout(() => setError(null), 3000);
            } else {
                const product = result.data;
                setCart(prevCart => {
                    const existingItem = prevCart.find(item => item.inventory_id === product.inventory_id);
                    if (existingItem) {
                        return prevCart.map(item => item.inventory_id === product.inventory_id ? { ...item, quantity: item.quantity + 1 } : item);
                    } else {
                        return [...prevCart, { ...product, price: parseFloat(product.price), quantity: 1 }];
                    }
                });
            }
        });
    };
    
    const updateQuantity = (inventoryId: string, newQuantity: number) => {
        setCart(cart.map(item => item.inventory_id === inventoryId ? { ...item, quantity: newQuantity } : item).filter(item => item.quantity > 0));
    };

    const removeItem = (inventoryId: string) => {
        setCart(cart.filter(item => item.inventory_id !== inventoryId));
    };

    const handleProcessSale = (paymentMethod: string) => {
        setError(null);
        
        startTransition(async () => {
            const cartForAction = cart.map(item => ({
                inventory_id: item.inventory_id,
                quantity: item.quantity,
                price_at_sale: item.price
            }));

            const result = await processSale(cartForAction, paymentMethod);

            // --- ¡CAMBIO! ---
            // En lugar de mostrar un mensaje de éxito aquí, redirigimos
            if (result.success && result.orderId) {
                router.push(`/admin/orders/${result.orderId}`);
            } else {
                setError(result.message || "Ocurrió un error desconocido.");
            }
        });
    }

    return (
        <div className="flex flex-col md:flex-row h-screen bg-gray-100 font-sans">
            <div className="w-full md:w-1/3 bg-white p-6 shadow-lg flex flex-col">
                <PosCart 
                    items={cart}
                    updateQuantity={updateQuantity}
                    removeItem={removeItem}
                    processSale={handleProcessSale}
                    isProcessing={isProcessing}
                />
            </div>

            <div className="w-full md:w-2/3 p-8">
                <div className="max-w-xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Punto de Venta</h1>
                    <p className="text-gray-500 mb-8">Escanee un código de barras o ingréselo manualmente para añadirlo a la venta.</p>

                    <form action={handleSearch}>
                        <div className="relative">
                            <input
                                ref={barcodeInputRef}
                                type="text"
                                name="barcode"
                                placeholder="Esperando código de barras..."
                                className="w-full pl-5 pr-16 py-4 text-xl bg-white border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-gray-500"
                                disabled={isProcessing}
                            />
                            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-indigo-600" disabled={isProcessing}>
                                <SearchIcon className="h-7 w-7" />
                            </button>
                        </div>
                    </form>

                    {isProcessing && <p className="text-center mt-4 text-gray-600">Procesando...</p>}
                    {error && <p className="text-center mt-4 text-red-600 font-semibold bg-red-100 p-3 rounded-lg">{error}</p>}
                </div>
            </div>
        </div>
    );
}
