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
    requires_invoice: boolean;
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


// =================================================================
// INICIO DE LAS CORRECCIONES DE ESLINT
// =================================================================

// --- Componente CustomerTicket (EXTRAÍDO) ---
// Se extrajo el componente para evitar "unstable nested components".
// Ahora recibe toda su información a través de props.
interface CustomerTicketProps {
    title: string;
    details: OrderDetail;
    isSpecialOrder: boolean;
    needsInvoice: boolean;
    subtotal: number;
    iva: number;
}

const CustomerTicket = ({ title, details, isSpecialOrder, needsInvoice, subtotal, iva }: CustomerTicketProps) => (
    <div className="bg-white text-black p-1 font-mono">
        <header className="text-center mb-1">
            <LogoComponent className="mx-auto w-8 h-8 rounded-full mb-1" />
            <h1 className="text-sm font-bold">Levist Uniforms</h1>
            <p className="text-[10px] leading-tight">Matamoros, Tamaulipas</p>
            <p className="mt-1 font-semibold text-xs">{title}</p>
        </header>

        <section className="my-1 text-[10px] leading-tight space-y-0.5">
            <p><b>No. Orden:</b> {details.order_id.slice(0, 8)}</p>
            <p><b>Fecha:</b> {new Date(details.order_date).toLocaleString('es-MX')}</p>
            <p><b>Vendedor:</b> {details.seller_name || 'N/A'}</p>
            <p><b>Cliente:</b> {details.customer_name || 'Mostrador'}</p>
        </section>

        {isSpecialOrder && (details.school_name || details.embroidery_notes) && (
            <section className="my-1 text-[10px] border-t border-dashed border-black pt-1">
                <h2 className="font-bold text-center text-xs mb-0.5">Detalles del Pedido</h2>
                {details.school_name && <p><b>Escuela:</b> {details.school_name}</p>}
                {details.embroidery_notes && <p><b>Notas:</b> {details.embroidery_notes}</p>}
            </section>
        )}

        <section className="border-t border-b border-dashed border-black py-1 my-1">
            <div className="w-full text-[10px] leading-tight">
                <div className="flex font-bold">
                    <div className="flex-grow pr-2">PRODUCTO</div>
                    <div className="w-14 text-right pr-2">UNIT</div>
                    <div className="w-14 text-right">TOTAL</div>
                </div>
                <div className="border-b border-dashed border-black w-full"></div>
                
                {details.items.map(item => (
                    <div key={item.item_id} className="mt-3 flex items-start">
                        <div className="flex-grow pr-2">
                            <span>{item.quantity}x {item.product_name}</span>
                        </div>
                        <div className="w-14 text-right pr-2">
                            {/* CORRECCIÓN: Se elimina el `Number()` redundante */}
                            ${item.price_at_sale.toFixed(2)}
                        </div>
                        <div className="w-14 text-right">
                            ${(item.price_at_sale * item.quantity).toFixed(2)}
                        </div>
                    </div>
                ))}
            </div>
        </section>
        
        <section className="mt-1 text-xs">
            {needsInvoice ? (
                <>
                    <div className="flex justify-between text-[10px]">
                        <span>SUBTOTAL:</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                        <span>IVA (16%):</span>
                        <span>${iva.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm border-t border-dashed border-black mt-1 pt-1">
                        <span>TOTAL:</span>
                        <span>${details.order_total.toFixed(2)}</span>
                    </div>
                </>
            ) : (
                <div className="flex justify-between font-bold text-sm pt-1 mt-1">
                    <span>TOTAL:</span>
                    <span>${details.order_total.toFixed(2)}</span>
                </div>
            )}
            <div className="flex justify-between text-[10px] mt-1">
                <span>Método Pago:</span>
                <span>{details.payment_method || 'N/A'}</span>
            </div>
        </section>
        
        <footer className="mt-2 pt-1 border-t border-dashed border-black flex flex-col items-center text-center">
            <p className="text-[10px] mb-1">¡Gracias por su compra!</p>
            <div className="w-20 h-20 bg-white p-0.5">
                <QRCode value={details.order_id} size={128} style={{ height: "auto", maxWidth: "100%", width: "100%" }} viewBox={`0 0 256 256`}/>
            </div>
        </footer>
    </div>
);


// --- Componente WorkOrderTicket (EXTRAÍDO) ---
// Se extrajo el componente para evitar "unstable nested components".
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
        <section className="my-1 text-xs space-y-0.5 leading-tight">
            <p><b>No. Orden:</b> {details.order_id.slice(0, 8)}</p>
            <p><b>Cliente:</b> {details.customer_name}</p>
            {details.school_name && <p><b>Escuela:</b> {details.school_name}</p>}
        </section>
        {details.embroidery_notes && (
            <section className="my-1 p-1 border border-black rounded-sm bg-yellow-100">
                <h2 className="font-bold text-xs mb-0.5">Instrucciones:</h2>
                <p className="text-[10px] whitespace-pre-wrap">{details.embroidery_notes}</p>
            </section>
        )}
        <section className="border-t border-dashed border-black py-1 my-1">
            <h2 className="font-bold text-xs mb-0.5">Prendas a Preparar:</h2>
            <ul className="text-[10px] leading-tight space-y-1">
                {details.items.map(item => (
                    <li key={item.item_id} className="border-b border-dotted border-black pb-1">
                        <p className="font-bold">{item.product_name}</p>
                        <p>Talla: {item.size} | Color: {item.color}</p>
                        <p>Cantidad: <b className="text-sm">{item.quantity}</b></p>
                    </li>
                ))}
            </ul>
        </section>
        <footer className="mt-2 flex justify-center">
            <div className="w-20 h-20 bg-white p-0.5">
                <QRCode value={details.order_id} size={128} style={{ height: "auto", maxWidth: "100%", width: "100%" }} viewBox={`0 0 256 256`}/>
            </div>
        </footer>
    </div>
);

// =================================================================
// FIN DE LAS CORRECCIONES
// =================================================================


// --- Componente Principal del Recibo ---
export function Receipt({ details }: ReceiptProps) {
    
    // CORRECCIÓN: Se usa `useCallback` para memorizar la función.
    const handlePrint = React.useCallback(() => {
        window.print();
    }, []);

    const isSpecialOrder = details.order_status !== 'COMPLETED' && details.order_status !== 'DELIVERED';
    
    const needsInvoice = details.requires_invoice;

    // CORRECCIÓN: El "magic number" se extrae a una constante.
    const VAT_RATE = 1.16;
    
    // El uso de `useMemo` aquí asegura que el cálculo solo se rehaga si los detalles de la orden cambian.
    const { subtotal, iva } = React.useMemo(() => {
        let calculatedSubtotal = 0;
        let calculatedIva = 0;
        
        if (needsInvoice) {
            calculatedSubtotal = details.order_total / VAT_RATE;
            calculatedIva = details.order_total - calculatedSubtotal;
            
            const decimal = calculatedIva - Math.floor(calculatedIva);
            if (decimal > 0) {
                calculatedIva = Math.ceil(calculatedIva);
                calculatedSubtotal = details.order_total - calculatedIva;
            }
        }
        
        return { subtotal: calculatedSubtotal, iva: calculatedIva };
    }, [details.order_total, needsInvoice]);

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

            <div className="no-print text-center mb-6">
                <button 
                    onClick={handlePrint}
                    className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <PrintIcon className="h-5 w-5"/>
                    Imprimir Ticket
                </button>
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
                    />
                )}
            </div>
        </div>
    );
}