// admin/pos/page.tsx
"use client";

import React, { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// --- MODIFICADO ---
// Se importa la nueva acción y los nuevos tipos
import { findProductByBarcode, processSaleAction, getSchools, SalePayload } from './actions';
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

// --- NUEVO ---
// Tipo para los datos de las escuelas que vienen del servidor
type School = {
    id: string;
    name: string;
};

// --- Iconos (sin cambios) ---
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
// --- NUEVO ---
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

    // --- NUEVO ---
    // Estados para el formulario de pedido especial
    const [isSpecialOrder, setIsSpecialOrder] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [schoolId, setSchoolId] = useState<string | null>(null);
    const [embroideryNotes, setEmbroideryNotes] = useState('');
    const [schools, setSchools] = useState<School[]>([]);

    // --- MODIFICADO: Función para mantener el foco ---
    const focusBarcodeInput = () => {
        // Usamos setTimeout para asegurar que el DOM se haya actualizado
        setTimeout(() => {
            if (barcodeInputRef.current) {
                barcodeInputRef.current.focus();
            }
        }, 100);
    };

    useEffect(() => {
        focusBarcodeInput();
        // Cargar las escuelas cuando el componente se monta
        getSchools().then(setSchools);
    }, []);

    // --- MODIFICADO: Mantener foco después de agregar productos al carrito ---
    useEffect(() => {
        if (cart.length > 0) {
            focusBarcodeInput();
        }
    }, [cart]);

    const handleSearch = (formData: FormData) => {
        const barcode = formData.get('barcode') as string;
        if (!barcode.trim()) return;
        
        setError(null);
        startTransition(async () => {
            const result = await findProductByBarcode(barcode.trim());
            
            // --- MODIFICADO: Limpiar el input y mantener foco ---
            if (barcodeInputRef.current) {
                barcodeInputRef.current.value = "";
            }
            
            if (!result.success || !result.data) {
                setError(result.message || "Producto no encontrado.");
                setTimeout(() => setError(null), 3000);
                // Mantener foco incluso cuando hay error
                focusBarcodeInput();
            } else {
                const product = result.data;
                setCart(prevCart => {
                    const existingItem = prevCart.find(item => item.inventory_id === product.inventory_id);
                    if (existingItem) {
                        return prevCart.map(item => 
                            item.inventory_id === product.inventory_id 
                                ? { ...item, quantity: item.quantity + 1 } 
                                : item
                        );
                    } else {
                        return [...prevCart, { ...product, price: parseFloat(product.price), quantity: 1 }];
                    }
                });
                // El useEffect se encargará de mantener el foco cuando el carrito cambie
            }
        });
    };

    // --- MODIFICADO: Mantener foco después de interacciones con el carrito ---
    const updateQuantity = (inventoryId: string, newQuantity: number) => {
        setCart(cart.map(item => 
            item.inventory_id === inventoryId 
                ? { ...item, quantity: newQuantity } 
                : item
        ).filter(item => item.quantity > 0));
        // Mantener foco después de actualizar cantidad
        focusBarcodeInput();
    };

    const removeItem = (inventoryId: string) => {
        setCart(cart.filter(item => item.inventory_id !== inventoryId));
        // Mantener foco después de remover item
        focusBarcodeInput();
    };

    // --- MODIFICADO ---
    // La lógica de procesar la venta ahora usa la nueva acción y los nuevos datos
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
                // Si es exitoso, redirigimos a la página de la orden para ver los detalles
                router.push(`/admin/orders/${result.orderId}`);
            } else {
                setError(result.message || "Ocurrió un error desconocido.");
                // Mantener foco incluso si hay error en la venta
                focusBarcodeInput();
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
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Punto de Venta</h1>
                    <p className="text-gray-700 mb-8 font-medium">Escanee un código de barras o ingréselo manualmente para añadirlo a la venta.</p>

                    <form action={handleSearch} className='mb-8'>
                        <div className="relative">
                            <input
                                ref={barcodeInputRef}
                                type="text"
                                name="barcode"
                                placeholder="Esperando código de barras..."
                                className="w-full pl-12 pr-32 py-4 text-lg bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-gray-600"
                                disabled={isProcessing}
                                autoComplete="off"
                                // --- NUEVO: Mantener foco en eventos adicionales ---
                                onBlur={() => {
                                    // Si el input pierde el foco, lo recuperamos después de un breve delay
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

                    {/* --- NUEVO: FORMULARIO PARA PEDIDOS ESPECIALES --- */}
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
                                        // --- NUEVO: Recuperar foco del barcode cuando termine de editar ---
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

                    {isProcessing && <p className="text-center mt-4 text-gray-800 font-medium">Procesando...</p>}
                    {error && <p className="text-center mt-4 text-red-700 font-semibold bg-red-100 p-4 rounded-lg border border-red-200">{error}</p>}
                </div>
            </div>
        </div>
    );
}