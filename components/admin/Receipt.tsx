"use client";

import React from 'react';
import Image from 'next/image';
import QRCode from 'react-qr-code';

// --- Tipos de Datos (sin cambios) ---
type OrderDetail = {
    order_id: string;
    order_date: string;
    order_total: number;
    order_status: string;
    payment_method: string | null;
    seller_name: string | null;
    customer_name: string | null;
    embroidery_notes: string | null;
    school_name?: string;
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
         <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6 18.25m10.56-4.421c.24.03.48.062.72.096m-.72-.096L18 18.25m-12 0h12M12 15V9m0 2.25a.75.75 0 0 0-.75.75v4.5a.75.75 0 0 0 1.5 0v-4.5A.75.75 0 0 0 12 11.25Z" />
    </svg>
);

// --- Componente de Logo con fallback (sin cambios) ---
const LogoComponent = ({ className }: { className?: string }) => {
    const [imageError, setImageError] = React.useState(false);
    
    if (imageError) {
        return (
            <div className={`${className} bg-indigo-600 text-white flex items-center justify-center rounded-full font-bold text-xl`}>
                LU
            </div>
        );
    }
    
    return (
        <Image 
            src="/logo.jpg" 
            alt="Levist Uniforms Logo" 
            width={64} 
            height={64} 
            className={className}
            onError={() => setImageError(true)}
        />
    );
};

// --- Componente del Ticket ---
export function Receipt({ details }: ReceiptProps) {
    
    const handlePrint = () => {
        window.print();
    };

    const isSpecialOrder = details.order_status !== 'COMPLETED' && details.order_status !== 'DELIVERED';

    const CustomerTicket = ({ title }: { title: string }) => (
        <div className="bg-white text-black p-2">
            <header className="text-center border-b border-dashed border-black pb-2 mb-2">
                <LogoComponent className="mx-auto w-12 h-12 rounded-full mb-2" />
                <h1 className="text-lg font-bold">Levist Uniforms</h1>
                <p className="text-xs">Matamoros, Tamaulipas</p>
                <p className="mt-1 font-semibold text-base">{title}</p>
            </header>

            <section className="my-2 text-xs space-y-0.5">
                <div className="flex justify-between"><span className="font-semibold">No. Orden:</span><span>{details.order_id.slice(0, 8)}</span></div>
                <div className="flex justify-between"><span className="font-semibold">Fecha:</span><span>{new Date(details.order_date).toLocaleString('es-MX')}</span></div>
                <div className="flex justify-between"><span className="font-semibold">Vendedor:</span><span>{details.seller_name || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="font-semibold">Cliente:</span><span>{details.customer_name || 'Mostrador'}</span></div>
            </section>

            {isSpecialOrder && (details.school_name || details.embroidery_notes) && (
                <section className="my-2 text-xs border-t border-b border-dashed border-black py-2">
                    <h2 className="font-bold mb-1">Detalles del Pedido</h2>
                    {details.school_name && <p><span className='font-semibold'>Escuela:</span> {details.school_name}</p>}
                    {details.embroidery_notes && <p><span className='font-semibold'>Notas:</span> {details.embroidery_notes}</p>}
                </section>
            )}

            <section className="border-t border-b border-dashed border-black py-2 my-2">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-dashed border-black">
                            <th className="text-left font-semibold pb-1 pr-1">C.</th>
                            <th className="text-left font-semibold pb-1">PRODUCTO</th>
                            <th className="text-right font-semibold pb-1 pl-1">TOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        {details.items.map(item => (
                            <tr key={item.item_id}>
                                <td className="align-top py-0.5 pr-1">{item.quantity}</td>
                                <td className="align-top py-0.5 whitespace-normal leading-tight">{item.product_name} (${Number(item.price_at_sale).toFixed(2)})</td>
                                <td className="align-top text-right py-0.5 pl-1">${(Number(item.price_at_sale) * item.quantity).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
            
            <section className="mt-2 space-y-0.5 text-xs">
                <div className="flex justify-between font-bold text-base border-t border-dashed border-black pt-1 mt-1">
                    <span>TOTAL:</span>
                    <span>${details.order_total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Método de Pago:</span>
                    <span>{details.payment_method || 'N/A'}</span>
                </div>
            </section>
            
            <footer className="mt-4 pt-2 border-t border-dashed border-black flex flex-col items-center">
                <p className="text-xs mb-2">¡Gracias por su compra!</p>
                <div className="w-24 h-24 bg-white p-1">
                     <QRCode value={details.order_id} size={256} style={{ height: "auto", maxWidth: "100%", width: "100%" }} viewBox={`0 0 256 256`}/>
                </div>
            </footer>
        </div>
    );

    const WorkOrderTicket = () => (
         <div className="bg-white text-black p-2">
            <header className="text-center border-b border-dashed border-black pb-2 mb-2">
                <LogoComponent className="mx-auto w-12 h-12 rounded-full mb-2" />
                <h1 className="text-lg font-bold">Orden de Trabajo</h1>
                <p className="font-semibold text-base">PRODUCCIÓN / TALLER</p>
            </header>
            
            <section className="my-2 text-sm space-y-1">
                <div className="flex justify-between"><span className="font-semibold">No. Orden:</span><span>{details.order_id.slice(0, 8)}</span></div>
                <div className="flex justify-between"><span className="font-semibold">Cliente:</span><span className="font-bold text-base">{details.customer_name}</span></div>
                {details.school_name && <div className="flex justify-between"><span className="font-semibold">Escuela:</span><span className="font-bold">{details.school_name}</span></div>}
            </section>
            
            {details.embroidery_notes && (
                <section className="my-2 p-2 border border-black rounded-md bg-yellow-100">
                    <h2 className="font-bold text-base mb-1">Instrucciones:</h2>
                    <p className="text-sm whitespace-pre-wrap">{details.embroidery_notes}</p>
                </section>
            )}
            
            <section className="border-t border-b border-dashed border-black py-2 my-2">
                <h2 className="font-bold text-base mb-1">Prendas a Preparar:</h2>
                <ul className="divide-y divide-dashed divide-black">
                    {details.items.map(item => (
                        <li key={item.item_id} className="py-1">
                            <p className="font-medium">{item.product_name}</p>
                            <p className="text-xs">Talla: {item.size} | Color: {item.color} | Cantidad: <span className='font-bold'>{item.quantity}</span></p>
                        </li>
                    ))}
                </ul>
            </section>
            
            <footer className="mt-4 flex justify-center">
                <div className="w-24 h-24 bg-white p-1">
                    <QRCode value={details.order_id} size={256} style={{ height: "auto", maxWidth: "100%", width: "100%" }} viewBox={`0 0 256 256`}/>
                </div>
            </footer>
        </div>
    );

    return (
        <div className="bg-gray-100 p-4">
            
            {/* --- ESTILOS DE IMPRESIÓN CORREGIDOS --- */}
            <style jsx global>{`
                @media print {
                    /* Ocultar todo por defecto, excepto el área imprimible */
                    body * {
                        visibility: hidden;
                    }
                    .printable-area, .printable-area * {
                        visibility: visible;
                    }

                    /* Forzar un fondo blanco y resetear la página */
                    html, body {
                        margin: 0;
                        padding: 0;
                        background: #fff;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }

                    /* Configuración principal del ticket */
                    .printable-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 80mm; /* Ancho de impresora térmica estándar */
                        height: auto; /* Altura automática para que crezca */
                        font-family: 'Courier New', Courier, monospace;
                        font-size: 9pt; /* Tamaño de fuente para recibo */
                        color: #000;
                        background: #fff;
                    }
                    
                    /* Ocultar el botón de imprimir */
                    .no-print {
                        display: none !important;
                    }
                    
                    /* Evitar que la línea de corte se divida entre páginas */
                    .cut-line {
                        page-break-after: always; /* Fuerza un salto DESPUÉS de la línea de corte */
                        page-break-inside: avoid;
                    }
                }
            `}</style>

            {/* --- Botón para Imprimir (No se imprime) --- */}
            <div className="no-print text-center mb-6">
                <button 
                    onClick={handlePrint}
                    className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <PrintIcon className="h-5 w-5"/>
                    Imprimir Ticket
                </button>
            </div>

            {/* --- ÁREA IMPRIMIBLE --- */}
            {/* Este es el único contenedor que se hará visible al imprimir */}
            <div className="printable-area">
                {isSpecialOrder ? (
                    <>
                        <CustomerTicket title="COPIA - CLIENTE" />
                        {/* Línea de corte que fuerza un salto de página */}
                        <div className="cut-line text-center text-xs text-gray-500 border-t-2 border-dashed border-black my-4 py-2">
                           &ndash; &ndash; &ndash; Cortar &ndash; &ndash; &ndash;
                        </div>
                        <WorkOrderTicket />
                    </>
                ) : (
                    <CustomerTicket title="TICKET DE VENTA" />
                )}
            </div>
        </div>
    );
}
