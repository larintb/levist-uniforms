"use client";

import React from 'react';
import Image from 'next/image';
import QRCode from 'react-qr-code';
import { MultiCopyPrintButton } from './MultiCopyPrintButton';

// --- Tipos de Datos ---
type OrderDetail = {
    order_id: string;
    order_date: string;
    order_total: number;
    subtotal: number;
    discount_amount: number;
    discount_reason: string | null;
    order_status: string;
    requires_invoice: boolean;
    payment_method: string | null;
    seller_name: string | null;
    customer_name: string | null;
    embroidery_notes: string | null;
    school_name?: string;
    is_layaway: boolean;
    down_payment: number;
    remaining_balance: number;
    items: {
        item_id: string;
        product_name: string;
        sku: string;
        color: string;
        size: string;
        quantity: number;
        price_at_sale: number;
        delivered: boolean; // Campo añadido para estado de entrega
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

// --- Componente de Logo (sin cambios) ---
const LogoComponent = ({ className }: { className?: string }) => {
    const [imageError, setImageError] = React.useState(false);

    if (imageError) {
        return (
            <div className={`${className} bg-indigo-600 text-white flex items-center justify-center rounded-full font-bold text-sm`}>
                LU
            </div>
        );
    }

    return (
        <Image
            src="/logo.jpg"
            alt="Levist Uniforms Logo"
            width={40}
            height={40}
            className={className}
            onError={() => setImageError(true)}
        />
    );
};

// --- Componente CustomerTicket (CORREGIDO) ---
interface CustomerTicketProps {
    title: string;
    details: OrderDetail;
    isSpecialOrder: boolean;
    needsInvoice: boolean;
    subtotal: number;
    iva: number;
    discountAmount: number;
    discountReason: string | null;
}

const CustomerTicket = ({ title, details, isSpecialOrder, needsInvoice, subtotal, iva, discountAmount, discountReason }: CustomerTicketProps) => (
    <div className="bg-white text-black p-1 font-mono">
        <header className="text-center mb-1">
            <LogoComponent className="mx-auto w-8 h-8 rounded-full mb-1" />
            <h1 className="text-sm font-bold">Levist Uniforms</h1>
            <p className="text-[10px] leading-tight">Matamoros, Tamaulipas</p>
            <p className="mt-1 font-semibold text-xs">{title}</p>
        </header>

        <section className="my-1 leading-tight space-y-0.5">
            <p className="font-black text-xs"><b>No. Orden:</b> {details.order_id.slice(0, 8)}</p>
            <p className="font-black text-xs"><b>Fecha:</b> {new Date(details.order_date).toLocaleString('es-MX', { timeZone: 'America/Matamoros' })}</p>
            <p className="font-black text-xs"><b>Vendedor:</b> {details.seller_name || 'N/A'}</p>
            <p className="font-black text-xs"><b>CLIENTE:</b></p>
            <p className="font-black text-xs pl-2">{details.customer_name || 'MOSTRADOR'}</p>
        </section>

        {isSpecialOrder && (details.school_name || details.embroidery_notes) && (
            <section className="my-1 border-t border-dashed border-black pt-1">
                <h2 className="font-bold text-center text-xs mb-0.5">Detalles del Pedido</h2>
                {details.school_name && <p className="font-black text-xs"><b>Escuela:</b> {details.school_name}</p>}
                {details.embroidery_notes && <p className="font-black text-xs"><b>Notas:</b> {details.embroidery_notes}</p>}
            </section>
        )}

        <section className="border-t border-b border-dashed border-black py-1 my-1">
            <div className="w-full leading-tight">
                <div className="flex font-black text-xs mb-1">
                    <div className="flex-grow pr-1">PRODUCTO</div>
                    <div className="w-16 text-right pr-1">UNIT</div>
                    <div className="w-16 text-right">TOTAL</div>
                </div>
                <div className="border-b border-dashed border-black w-full mb-1"></div>
                
                {details.items.map(item => (
                    <div key={item.item_id} className="mb-2 flex items-start">
                        <div className="flex-grow pr-1">
                            <div className="font-black text-xs">
                                <span className={`${item.delivered ? 'text-black' : 'text-black'}`}>
                                    {item.delivered ? '[E]' : '[P]'}
                                </span>
                                <span className="ml-1">{item.quantity}x {item.product_name}</span>
                            </div>
                            <div className="font-black text-[10px] text-gray-600 mt-0.5">
                                {item.size} | {item.color}
                            </div>
                        </div>
                        <div className="w-16 text-right pr-1 font-black text-xs">
                            ${item.price_at_sale.toFixed(2)}
                        </div>
                        <div className="w-16 text-right font-black text-xs">
                            ${(item.price_at_sale * item.quantity).toFixed(2)}
                        </div>
                    </div>
                ))}
            </div>
        </section>
        
        <section className="mt-1 space-y-0.5">
            <div className="flex justify-between font-black text-xs">
                <span>SUBTOTAL:</span>
                <span>${subtotal.toFixed(2)}</span>
            </div>

            {/* ================================================================= */}
            {/* CORRECCIÓN: Se eliminó la condición para que siempre se muestre. */}
            {/* ================================================================= */}
            <div className="flex justify-between font-black text-xs text-black">
                <span>DESCUENTO ({discountReason || 'General'}):</span>
                <span>-${(discountAmount || 0).toFixed(2)}</span>
            </div>
            {/* ================================================================= */}
            
            {needsInvoice && (
                <div className="flex justify-between font-black text-xs">
                    <span>IVA (16%):</span>
                    <span>${iva.toFixed(2)}</span>
                </div>
            )}

            <div className="flex justify-between font-bold text-sm border-t border-dashed border-black mt-1 pt-1">
                <span>TOTAL:</span>
                <span>${details.order_total.toFixed(2)}</span>
            </div>

            <div className="flex justify-between font-black text-xs mt-1">
                <span>Método Pago:</span>
                <span>{details.payment_method || 'N/A'}</span>
            </div>

            {details.is_layaway && (
                <div className="border-t border-dashed border-black mt-1 pt-1">
                    <div className="text-center text-xs font-bold mb-1 bg-blue-50 p-1 rounded">
                        🏦 SEPARADO
                    </div>
                    <div className="flex justify-between font-black text-xs">
                        <span>Anticipo Pagado:</span>
                        <span className="text-black font-bold">-${details.down_payment.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-black text-xs">
                        <span>Saldo Pendiente:</span>
                        <span className={`font-bold ${details.remaining_balance > 0 ? 'text-black' : 'text-black'}`}>
                            ${details.remaining_balance.toFixed(2)}
                        </span>
                    </div>
                    {details.remaining_balance > 0 && (
                        <div className="text-center font-black text-xs mt-1 p-1 bg-yellow-50 rounded">
                            ⚠️ RECUERDE COMPLETAR EL PAGO
                        </div>
                    )}
                </div>
            )}
        </section>
        
        <footer className="mt-2 pt-1 border-t border-dashed border-black flex flex-col items-center text-center">
            <div className="font-black text-xs text-gray-700 mb-1">
                [E] Entregado | [P] Pendiente
            </div>
            <p className="font-black text-xs mb-1">¡Gracias por su compra!</p>
            <div className="w-20 h-20 bg-white p-0.5">
                <QRCode value={details.order_id} size={128} style={{ height: "auto", maxWidth: "100%", width: "100%" }} viewBox={`0 0 256 256`}/>
            </div>
        </footer>
    </div>
);


// --- Componente WorkOrderTicket (Sin cambios) ---
interface WorkOrderTicketProps {
    details: OrderDetail;
}

const WorkOrderTicket = ({ details }: WorkOrderTicketProps) => (
    <div className="bg-white text-black p-1 font-mono">
        <header className="text-center mb-1">
            <LogoComponent className="mx-auto w-8 h-8 rounded-full mb-1" />
            <h1 className="text-sm font-bold">Orden de Trabajo</h1>
            <p className="font-semibold text-xs">PRODUCCIÓN / TALLER</p>
        </header>
        <section className="my-1 space-y-0.5 leading-tight">
            <p className="font-black text-xs"><b>No. Orden:</b> {details.order_id.slice(0, 8)}</p>
            <p className="font-black text-xs"><b>CLIENTE:</b></p>
            <p className="font-black text-xs pl-2">{details.customer_name}</p>
            {details.school_name && <p className="font-black text-xs"><b>Escuela:</b> {details.school_name}</p>}
        </section>
        {details.embroidery_notes && (
            <section className="my-1 p-1 border border-black rounded-sm bg-white">
                <h2 className="font-bold text-xs mb-0.5">Instrucciones:</h2>
                <p className="font-black text-xs whitespace-pre-wrap">{details.embroidery_notes}</p>
            </section>
        )}
        
        <footer className="mt-2 flex justify-center">
            <div className="w-20 h-20 bg-white p-0.5">
                <QRCode value={details.order_id} size={128} style={{ height: "auto", maxWidth: "100%", width: "100%" }} viewBox={`0 0 256 256`}/>
            </div>
        </footer>
    </div>
);


// --- Componente Principal del Recibo (Sin cambios) ---
export function Receipt({ details }: ReceiptProps) {
    
    const handlePrint = React.useCallback(() => {
        window.print();
    }, []);

    const isSpecialOrder = details.order_status !== 'COMPLETED' && details.order_status !== 'DELIVERED';
    const needsInvoice = details.requires_invoice;

    const { subtotal, iva, discountAmount, discountReason } = React.useMemo(() => {
        const preDiscountSubtotal = details.items.reduce((acc, item) => {
            return acc + (item.price_at_sale * item.quantity);
        }, 0);

        const calculatedIva = needsInvoice ? (details.order_total - (details.order_total / 1.16)) : 0;
        
        const calculatedDiscount = preDiscountSubtotal + calculatedIva - details.order_total;
        
        return {
            subtotal: preDiscountSubtotal,
            iva: calculatedIva,
            discountAmount: calculatedDiscount,
            discountReason: details.discount_reason
        };
    }, [details, needsInvoice]);

    return (
        <div className="bg-gray-100 p-4">
            
            <style jsx global>{`
                @media print {
                    body * { visibility: hidden; }
                    .printable-area, .printable-area * { visibility: visible; }
                    html, body { margin: 0 !important; padding: 0 !important; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .printable-area { position: absolute; left: 0; top: 0; width: 48mm; height: auto; font-family: 'monospace', 'Courier New', Courier; font-size: 7pt; color: #000; background: #fff; }
                    .no-print { display: none !important; }
                    .cut-line { page-break-after: always; page-break-inside: avoid; }
                }
            `}</style>

            <div className="no-print text-center mb-6 space-y-3">
                <button 
                    onClick={handlePrint}
                    className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <PrintIcon className="h-5 w-5"/>
                    Imprimir Ticket
                </button>
                
                <div className="mt-3">
                    <MultiCopyPrintButton 
                        orderId={details.order_id}
                        orderHasEmbroidery={!!details.embroidery_notes}
                        className="inline-flex items-center gap-2 bg-amber-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-amber-700 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
                        buttonText="Imprimir Órdenes de Trabajo"
                        showIcons={false}
                    />
                    <p className="text-xs text-gray-600 mt-2">
                        💡 Imprime solo las órdenes de trabajo (sin ticket de venta) - ideal para el taller
                    </p>
                </div>
            </div>

            <div className="printable-area">
                {isSpecialOrder ? (
                    <>
                        <CustomerTicket 
                            title="COPIA - CLIENTE"
                            details={details}
                            isSpecialOrder={isSpecialOrder}
                            needsInvoice={needsInvoice}
                            subtotal={subtotal}
                            iva={iva}
                            discountAmount={discountAmount}
                            discountReason={discountReason}
                        />
                        <div className="cut-line text-center text-[9px] text-gray-500 border-t-2 border-dashed border-black my-2 py-1">
                            &ndash; &ndash; Cortar &ndash; &ndash;
                        </div>
                        <WorkOrderTicket details={details} />
                    </>
                ) : (
                    <CustomerTicket 
                        title="TICKET DE VENTA"
                        details={details}
                        isSpecialOrder={isSpecialOrder}
                        needsInvoice={needsInvoice}
                        subtotal={subtotal}
                        iva={iva}
                        discountAmount={discountAmount}
                        discountReason={discountReason}
                    />
                )}
            </div>
        </div>
    );
}