// components/admin/PosCart.tsx
"use client";

import React, { useState, useMemo } from 'react';
import type { CartItem as CartItemFromPage } from '@/app/admin/pos/page';
import Image from 'next/image';

type CartItem = CartItemFromPage & {
    name: string;
};

interface PosCartProps {
    items: CartItem[];
    updateQuantity: (inventoryId: string, newQuantity: number) => void;
    removeItem: (inventoryId: string) => void;
    processSale: (
        paymentMethod: string, 
        subtotal: number,
        discountAmount: number,
        discountReason: string,
        total: number
    ) => void;
    isProcessing: boolean;
    requiresInvoice: boolean;
}

// --- Iconos ---
const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09.982-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;
const ShoppingBagIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.658-.463 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>;
const TagIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>;


export function PosCart({ items, updateQuantity, removeItem, processSale, isProcessing, requiresInvoice }: PosCartProps) {
    const [isCheckoutModalOpen, setCheckoutModalOpen] = useState(false);
    const [isDiscountModalOpen, setDiscountModalOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('Efectivo');
    const [finalTotalInput, setFinalTotalInput] = useState('');
    const [discountReason, setDiscountReason] = useState('');

    const subtotal = useMemo(() => items.reduce((acc, item) => acc + item.price * item.quantity, 0), [items]);
    const iva = useMemo(() => requiresInvoice ? subtotal * 0.16 : 0, [subtotal, requiresInvoice]);
    
    const discountAmount = useMemo(() => {
        const finalTotal = parseFloat(finalTotalInput);
        if (!isNaN(finalTotal) && finalTotal < subtotal) {
            return subtotal - finalTotal;
        }
        return 0;
    }, [finalTotalInput, subtotal]);

    const total = useMemo(() => subtotal - discountAmount + iva, [subtotal, discountAmount, iva]);

    const handleConfirmCheckout = () => {
        processSale(paymentMethod, subtotal, discountAmount, discountReason, total);
        setCheckoutModalOpen(false);
    }

    const handleApplyDiscount = () => {
        const finalTotal = parseFloat(finalTotalInput);
        if (isNaN(finalTotal) || finalTotal > subtotal) {
            alert("El total final no puede ser mayor que el subtotal.");
            return;
        }
        if (!discountReason) {
            alert("Por favor, seleccione un motivo para el descuento.");
            return;
        }
        setDiscountModalOpen(false);
    }
    
    const handleRemoveDiscount = () => {
        setFinalTotalInput('');
        setDiscountReason('');
    }

    return (
        <>
            {/* --- Contenido del Carrito --- */}
            <div className="flex-grow overflow-y-auto pr-2 -mr-2">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Carrito de Venta</h2>
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center text-gray-400 h-full">
                        <ShoppingBagIcon className="h-20 w-20 mb-4"/>
                        <p className="font-medium">El carrito está vacío</p>
                        <p className="text-sm">Escanee un producto para comenzar</p>
                    </div>
                ) : (
                    <ul className="space-y-4">
                        {items.map(item => (
                            <li key={item.inventory_id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                <Image
                                    src={item.image_url || 'https://placehold.co/64x64/e2e8f0/e2e8f0'}
                                    alt={item.name}
                                    className="h-16 w-16 rounded-md object-cover bg-gray-200"
                                    width={64}
                                    height={64}
                                />
                                <div className="flex-grow">
                                    <p className="font-semibold text-gray-800 text-sm">{item.name}</p>
                                    <p className="text-xs text-gray-500">{item.color} / {item.size}</p>
                                    <p className="font-bold text-sm text-indigo-600">${item.price.toFixed(2)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateQuantity(item.inventory_id, parseInt(e.target.value, 10) || 1)}
                                        className="w-14 text-center border rounded-md placeholder:text-gray-500"
                                        placeholder="1"
                                        min="1"
                                    />
                                    <button onClick={() => removeItem(item.inventory_id)} className="text-gray-400 hover:text-red-500 p-1">
                                        <TrashIcon className="h-5 w-5"/>
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* --- Modal de Checkout --- */}
            {isCheckoutModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in-fast">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
                        <h3 className="text-lg font-bold mb-4 text-black">Finalizar Venta</h3>
                        <div className="space-y-4">
                            <p className="text-gray-600">Total a Pagar: <span className="font-bold text-xl text-gray-800">${total.toFixed(2)}</span></p>
                            <div>
                                <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">Método de Pago</label>
                                <select id="paymentMethod" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-gray-500">
                                    <option>Efectivo</option>
                                    <option>Tarjeta de Crédito</option>
                                    <option>Tarjeta de Débito</option>
                                    <option>Transferencia</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setCheckoutModalOpen(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">Cancelar</button>
                            <button onClick={handleConfirmCheckout} disabled={isProcessing} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400">{isProcessing ? "Procesando...": "Confirmar Pago"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Modal de Descuento --- */}
            {isDiscountModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in-fast">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
                        <h3 className="text-lg font-bold mb-4 text-black">Aplicar Descuento</h3>
                        <div className="space-y-4">
                            <p className="text-gray-600">Subtotal Original: <span className="font-bold text-gray-800">${subtotal.toFixed(2)}</span></p>
                            <div>
                                <label htmlFor="finalTotal" className="block text-sm font-medium text-gray-700">Nuevo Total a Cobrar</label>
                                <input
                                    type="number"
                                    id="finalTotal"
                                    value={finalTotalInput}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFinalTotalInput(e.target.value)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-gray-500"
                                    placeholder="Ej. 2500"
                                />
                            </div>
                            {discountAmount > 0 && (
                                <p className="text-green-600 font-semibold">Descuento a aplicar: ${discountAmount.toFixed(2)}</p>
                            )}
                            <div>
                                <label htmlFor="discountReason" className="block text-sm font-medium text-gray-700">Motivo del Descuento</label>
                                <select 
                                    id="discountReason" 
                                    value={discountReason} 
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDiscountReason(e.target.value)} 
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md text-gray-500"
                                >
                                    <option value="">Seleccione un motivo...</option>
                                    <option value="Promoción Regreso a Clases">Promoción &quot;Regreso a Clases&quot;</option>
                                    <option value="Cliente Frecuente">Cliente Frecuente</option>
                                    <option value="Ajuste por Mercancía Dañada">Ajuste por Mercancía Dañada</option>
                                    <option value="Igualar Precio de Competencia">Igualar Precio de Competencia</option>
                                    <option value="Descuento de Empleado">Descuento de Empleado</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setDiscountModalOpen(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">Cancelar</button>
                            <button onClick={handleApplyDiscount} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Aplicar Descuento</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Resumen y Botón de Cobrar --- */}
            <div className="border-t pt-6 mt-6 space-y-3">
                <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                        <span>Descuento ({discountReason})</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between text-gray-600">
                    <span>IVA (16%)</span>
                    <span>${iva.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-2xl text-gray-800 border-t pt-2 mt-2">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex gap-2">
                    {discountAmount > 0 ? (
                        <button
                            onClick={handleRemoveDiscount}
                            className="w-full bg-red-500 text-white font-bold py-3 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                        >
                            <TrashIcon className="h-5 w-5" /> Quitar Descuento
                        </button>
                    ) : (
                        <button
                            onClick={() => setDiscountModalOpen(true)}
                            disabled={items.length === 0 || isProcessing}
                            className="w-full bg-gray-200 text-gray-800 font-bold py-3 rounded-lg hover:bg-gray-300 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <TagIcon className="h-5 w-5" /> Aplicar Descuento
                        </button>
                    )}
                    <button 
                        onClick={() => setCheckoutModalOpen(true)}
                        disabled={items.length === 0 || isProcessing}
                        className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                        {isProcessing ? "Procesando..." : "Cobrar"}
                    </button>
                </div>
            </div>
             <style jsx>{`
                 @keyframes fade-in-fast {
                     from { opacity: 0; }
                     to { opacity: 1; }
                 }
                 .animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out forwards; }
             `}</style>
        </>
    );
}
