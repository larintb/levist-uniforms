"use client";

import React from 'react';
import Image from 'next/image';

// --- Tipos de Datos (sin cambios) ---
type OrderDetail = {
    order_id: string;
    order_date: string;
    order_total: number;
    payment_method: string | null;
    seller_name: string | null;
    customer_name: string | null;
    items: {
        item_id: string;
        product_name: string;
        sku: string;
        color: string;
        size: string;
        quantity: number;
        price_at_sale: number;
    }[];
};

interface ReceiptProps {
    details: OrderDetail;
}

// --- Icono de Imprimir (sin cambios) ---
const PrintIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062-.72.096m-.72-.096L17.66 18m0 0a.75.75 0 00.75.75h.008a.75.75 0 00.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75v4.5a.75.75 0 00.75.75h.008a.75.75 0 00.75-.75z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 7.5V18a2.25 2.25 0 01-2.25 2.25H9.75A2.25 2.25 0 017.5 18V7.5m9 0V6A2.25 2.25 0 0014.25 3.75H9.75A2.25 2.25 0 007.5 6v1.5m9 0h-9" />
    </svg>
);

// --- Componente del Ticket (Refactorizado para impresión) ---
export function Receipt({ details }: ReceiptProps) {
    
    // La función de imprimir no cambia
    const handlePrint = () => {
        window.print();
    };
    
    return (
        // Contenedor principal para la vista en pantalla
        <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">

            {/* --- ESTILOS DE IMPRESIÓN MEJORADOS --- */}
            <style jsx global>{`
                @media print {
                    /* 1. Ocultar todo por defecto */
                    body * {
                        visibility: hidden;
                    }
                    /* 2. Hacer visible SOLO el área de impresión y su contenido */
                    .printable-area, .printable-area * {
                        visibility: visible;
                    }
                    /* 3. Ajustar el área de impresión para que ocupe la página */
                    .printable-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: auto;
                        padding: 0;
                        margin: 0;
                    }
                    /* Opcional: asegura que los colores de fondo se impriman */
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        background-color: #fff;
                    }
                }
            `}</style>

            {/* --- ÁREA IMPRIMIBLE --- */}
            <div className="printable-area">
                <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg print:shadow-none print:border-0">
                    <div className="p-6 sm:p-8">
                        <header className="text-center border-b pb-6">
                            {/* --- ¡CORREGIDO! Se usa la ruta correcta al logo en public --- */}
                            <Image src="/logo.jpg" alt="Levist Uniforms Logo" width={64} height={64} className="mx-auto rounded-full mb-4" />
                            <h1 className="text-2xl font-bold text-gray-900">Levist Uniforms</h1>
                            <p className="text-gray-600 text-sm">Matamoros, Tamaulipas</p>
                        </header>

                        <section className="my-6 text-sm">
                            <div className="flex justify-between text-gray-600">
                                <span className="font-semibold">No. Orden:</span>
                                <span className="font-mono text-gray-800">{details.order_id.slice(0, 8)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span className="font-semibold">Fecha:</span>
                                <span className="text-gray-800">{new Date(details.order_date).toLocaleString('es-MX')}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span className="font-semibold">Vendedor:</span>
                                <span className="text-gray-800">{details.seller_name || 'N/A'}</span>
                            </div>
                        </section>

                        <section className="border-t border-b py-4">
                            <table className="w-full text-sm table-fixed">
                                <thead>
                                    <tr className="border-b">
                                        {/* --- ¡CAMBIO! Se ajustan los anchos y espaciados --- */}
                                        <th className="w-5/12 text-left font-semibold py-2 text-gray-600 pr-2">Producto</th>
                                        <th className="w-2/12 text-center font-semibold py-2 text-gray-600 px-1">Cant.</th>
                                        <th className="w-2/12 text-right font-semibold py-2 text-gray-600 px-1">Precio</th>
                                        <th className="w-3/12 text-right font-semibold py-2 text-gray-600 pl-2">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {details.items.map(item => (
                                        <tr key={item.item_id}>
                                            {/* --- ¡CAMBIO! Se ajustan los anchos y espaciados --- */}
                                            <td className="py-2 pr-2">
                                                <p className="font-medium text-gray-800 truncate">{item.product_name}</p>
                                                <p className="text-xs text-gray-600">{item.color} / {item.size}</p>
                                            </td>
                                            <td className="text-center py-2 text-gray-800 px-1">{item.quantity}</td>
                                            <td className="text-right py-2 text-gray-800 px-1">${Number(item.price_at_sale).toFixed(2)}</td>
                                            <td className="text-right py-2 font-medium text-gray-900 pl-2">${(Number(item.price_at_sale) * item.quantity).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </section>
                        
                        <section className="mt-6 space-y-2 text-sm">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal:</span>
                                <span className="text-gray-800">${(details.order_total / 1.16).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>IVA (16%):</span>
                                <span className="text-gray-800">${(details.order_total - (details.order_total / 1.16)).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2 text-gray-900">
                                <span>TOTAL:</span>
                                <span>${details.order_total.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Método de Pago:</span>
                                <span className="text-gray-800">{details.payment_method || 'N/A'}</span>
                            </div>
                        </section>
                        
                        <footer className="text-center mt-8 pt-6 border-t border-dashed">
                            <p className="text-gray-600 text-xs">¡Gracias por su compra!</p>
                        </footer>
                    </div>
                </div>
            </div>
            
            {/* --- Botón para Imprimir (No se imprime) --- */}
            <div className="text-center mt-6 print:hidden">
                <button 
                    onClick={handlePrint}
                    className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <PrintIcon className="h-5 w-5"/>
                    Imprimir Ticket
                </button>
            </div>
        </div>
    );
}
