// admin/pos/page.tsx
"use client";

import React, { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { findProductByBarcode, processSaleAction, getSchools, SalePayload } from './actions';
// Asegúrate de que tu componente PosCart esté implementado para recibir los nuevos props de totales.
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

type School = {
    id: string;
    name: string;
};

interface ProductData {
    inventory_id: string;
    product_id: string;
    product_name: string;
    image_url: string;
    size: string;
    color: string;
    price: string | number;
    stock: number;
    barcode: string;
}

// --- Iconos ---
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const CheckboxIcon = ({ checked }: { checked: boolean }) => (
    <svg className={`h-6 w-6 ${checked ? 'text-indigo-600' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {checked ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" style={{ opacity: 0.4 }} />
        )}
    </svg>
);

// --- Componente Principal de la Página POS ---
export default function PosPage() {
    const [isProcessing, startTransition] = useTransition();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const barcodeInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const [isSpecialOrder, setIsSpecialOrder] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [schoolId, setSchoolId] = useState<string | null>(null);
    const [embroideryNotes, setEmbroideryNotes] = useState('');
    const [schools, setSchools] = useState<School[]>([]);

    const [requiresInvoice, setRequiresInvoice] = useState(false);

    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const iva = requiresInvoice ? subtotal * 0.16 : 0;
    const total = subtotal + iva;

    const focusBarcodeInput = () => {
        setTimeout(() => {
            if (barcodeInputRef.current) {
                barcodeInputRef.current.focus();
            }
        }, 100);
    };

    useEffect(() => {
        focusBarcodeInput();
        // Se ha mejorado la carga de datos para manejar posibles errores
        const fetchSchools = async () => {
            try {
                const schoolData = await getSchools();
                setSchools(schoolData);
            } catch (err) {
                console.error('Failed to load schools:', err);
                setError('No se pudieron cargar las escuelas. Intente recargar la página.');
            }
        };
        fetchSchools();
    }, []);

    useEffect(() => {
        if (cart.length > 0) {
            focusBarcodeInput();
        }
    }, [cart]);

    // MODIFICADO: Se usa un manejador de envío de formulario estándar para mayor claridad
    const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const barcode = formData.get('barcode') as string;

        if (!barcode.trim()) return;
        
        setError(null);
        startTransition(async () => {
            const result = await findProductByBarcode(barcode.trim());
            
            if (barcodeInputRef.current) {
                barcodeInputRef.current.value = "";
            }
            
            if (!result.success || !result.data) {
                setError(result.message || "Producto no encontrado.");
                setTimeout(() => setError(null), 3000);
            } else {
                const product = result.data as ProductData;
                setCart(prevCart => {
                    const existingItem = prevCart.find(item => item.inventory_id === product.inventory_id);
                    if (existingItem) {
                        return prevCart.map(item => 
                            item.inventory_id === product.inventory_id 
                                ? { ...item, quantity: item.quantity + 1 } 
                                : item
                        );
                    } else {
                        return [...prevCart, { 
                            inventory_id: product.inventory_id,
                            product_id: product.product_id,
                            name: product.product_name,
                            image_url: product.image_url,
                            size: product.size,
                            color: product.color,
                            price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
                            stock: product.stock,
                            barcode: product.barcode,
                            quantity: 1
                        }];
                    }
                });
            }
            // Siempre se vuelve a enfocar el input después de una búsqueda
            focusBarcodeInput();
        });
    };

    const updateQuantity = (inventoryId: string, newQuantity: number) => {
        setCart(cart.map(item => 
            item.inventory_id === inventoryId 
                ? { ...item, quantity: newQuantity } 
                : item
        ).filter(item => item.quantity > 0));
        focusBarcodeInput();
    };

    const removeItem = (inventoryId: string) => {
        setCart(cart.filter(item => item.inventory_id !== inventoryId));
        focusBarcodeInput();
    };

    const handleProcessSale = (paymentMethod: string) => {
        setError(null);
        
        startTransition(async () => {
            const payload: SalePayload = {
                cartItems: cart.map(item => ({
                    inventory_id: item.inventory_id,
                    quantity: item.quantity,
                    price_at_sale: item.price
                })),
                paymentMethod: paymentMethod,
                requiresInvoice: requiresInvoice,
                specialOrderData: {
                    isSpecialOrder: isSpecialOrder,
                    customerName: customerName,
                    customerPhone: customerPhone,
                    schoolId: schoolId,
                    embroideryNotes: embroideryNotes,
                }
            };

            const result = await processSaleAction(payload);

            if (result.success && result.orderId) {
                router.push(`/admin/orders/${result.orderId}`);
            } else {
                setError(result.message || "Ocurrió un error desconocido.");
                focusBarcodeInput();
            }
        });
    };

    return (
        <div className="flex flex-col md:flex-row h-screen bg-gray-100 font-sans">
            <div className="w-full md:w-1/3 bg-white p-6 shadow-lg flex flex-col">
                <PosCart 
                    items={cart}
                    updateQuantity={updateQuantity}
                    removeItem={removeItem}
                    processSale={handleProcessSale}
                    isProcessing={isProcessing}
                    subtotal={subtotal}
                    iva={iva}
                    total={total}
                />
            </div>

            <div className="w-full md:w-2/3 p-8">
                <div className="max-w-xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Punto de Venta</h1>
                    <p className="text-gray-700 mb-8 font-medium">Escanee un código de barras o ingréselo manualmente para añadirlo a la venta.</p>

                    <form onSubmit={handleSearchSubmit} className='mb-8'>
                        <div className="relative">
                            <input
                                ref={barcodeInputRef}
                                type="text"
                                name="barcode"
                                placeholder="Esperando código de barras..."
                                className="w-full pl-12 pr-32 py-4 text-lg bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-gray-600"
                                disabled={isProcessing}
                                autoComplete="off"
                                onBlur={() => {
                                    setTimeout(() => {
                                        if (document.activeElement?.tagName !== 'INPUT' && 
                                            document.activeElement?.tagName !== 'SELECT' && 
                                            document.activeElement?.tagName !== 'TEXTAREA') {
                                            focusBarcodeInput();
                                        }
                                    }, 100);
                                }}
                            />
                            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-indigo-600" disabled={isProcessing}>
                                <SearchIcon className="h-7 w-7" />
                            </button>
                        </div>
                    </form>

                    <div className="space-y-4">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <label htmlFor="requires-invoice-toggle" className="flex items-center cursor-pointer">
                                <CheckboxIcon checked={requiresInvoice} />
                                <span className="ml-3 text-lg font-semibold text-gray-900">¿Requiere Factura? (+16% IVA)</span>
                                <input
                                    id="requires-invoice-toggle"
                                    type="checkbox"
                                    className="hidden"
                                    checked={requiresInvoice}
                                    onChange={(e) => setRequiresInvoice(e.target.checked)}
                                />
                            </label>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <label htmlFor="special-order-toggle" className="flex items-center cursor-pointer">
                                <CheckboxIcon checked={isSpecialOrder} />
                                <span className="ml-3 text-lg font-semibold text-gray-900">¿Es un pedido especial? (Bordado/Encargo)</span>
                                <input
                                    id="special-order-toggle"
                                    type="checkbox"
                                    className="hidden"
                                    checked={isSpecialOrder}
                                    onChange={(e) => setIsSpecialOrder(e.target.checked)}
                                />
                            </label>

                            {isSpecialOrder && (
                                <div className="mt-6 space-y-4 animate-fade-in">
                                    <div>
                                        <label htmlFor="customerName" className="block text-sm font-semibold text-gray-900 mb-2">Nombre Completo del Cliente*</label>
                                        <input
                                            type="text"
                                            id="customerName"
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                            placeholder="Ej. Juan Pérez"
                                            onBlur={() => focusBarcodeInput()}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="customerPhone" className="block text-sm font-semibold text-gray-900 mb-2">Teléfono de Contacto</label>
                                        <input
                                            type="tel"
                                            id="customerPhone"
                                            value={customerPhone}
                                            onChange={(e) => setCustomerPhone(e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                            placeholder="Ej. 868-123-4567"
                                            onBlur={() => focusBarcodeInput()}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="schoolId" className="block text-sm font-semibold text-gray-900 mb-2">Escuela (para logo de bordado)</label>
                                        <select
                                            id="schoolId"
                                            value={schoolId ?? ''}
                                            onChange={(e) => setSchoolId(e.target.value || null)}
                                            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                                            onBlur={() => focusBarcodeInput()}
                                        >
                                            <option value="">Ninguna</option>
                                            {schools.map(school => (
                                                <option key={school.id} value={school.id}>{school.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="embroideryNotes" className="block text-sm font-semibold text-gray-900 mb-2">Notas de Bordado / Pedido</label>
                                        <textarea
                                            id="embroideryNotes"
                                            rows={3}
                                            value={embroideryNotes}
                                            onChange={(e) => setEmbroideryNotes(e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 resize-none"
                                            placeholder="Ej. Bordar 'Dr. Juan Pérez' en la filipina."
                                            onBlur={() => focusBarcodeInput()}
                                        ></textarea>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {isProcessing && <p className="text-center mt-4 text-gray-800 font-medium">Procesando...</p>}
                    {error && <p className="text-center mt-4 text-red-700 font-semibold bg-red-100 p-4 rounded-lg border border-red-200">{error}</p>}
                </div>
            </div>
        </div>
    );
}
