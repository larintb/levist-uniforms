// @/app/admin/orders/[id]/work-order/page.tsx
"use client";

import { createClient } from '@/lib/supabase/client';
import React, { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import Image from 'next/image';

// Componente actualizado que solo muestra la orden de trabajo
type OrderDetailsForWorkOrder = {
    order_id: string;
    order_date: string;
    customer_name: string | null;
    customer_phone: string | null;
    embroidery_notes: string | null;
    school_name?: string;
    seller_name: string | null;
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

// --- Componente de Logo ---
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

// Función para obtener solo los datos necesarios para la orden de trabajo
async function getWorkOrderDetails(orderId: string): Promise<OrderDetailsForWorkOrder | null> {
    const supabase = createClient();
    
    // Obtener detalles de la orden desde la vista
    const { data: viewData, error: viewError } = await supabase
        .from('full_order_details_view')
        .select('*')
        .eq('order_id', orderId);

    if (viewError || !viewData || viewData.length === 0) {
        console.error('Error al obtener detalles de la orden desde la vista:', viewError?.message);
        return null;
    }

    const orderInfo = viewData[0];

    const items = viewData.map(row => ({
        item_id: row.item_id,
        product_name: row.product_name,
        sku: row.sku,
        color: row.color,
        size: row.size,
        quantity: row.quantity,
        price_at_sale: row.price_at_sale,
    }));

    const workOrderDetails: OrderDetailsForWorkOrder = {
        order_id: orderInfo.order_id,
        order_date: orderInfo.order_date,
        customer_name: orderInfo.customer_name,
        customer_phone: orderInfo.customer_phone,
        embroidery_notes: orderInfo.embroidery_notes,
        school_name: orderInfo.school_name,
        seller_name: orderInfo.seller_name,
        items: items,
    };

    return workOrderDetails;
}

// Componente de Orden de Trabajo actualizado basado en Receipt.tsx
function WorkOrderTicket({ details }: { details: OrderDetailsForWorkOrder }) {
    return (
        <>
            <style jsx global>{`
                @media print {
                    body * { visibility: hidden; }
                    .work-order-printable, .work-order-printable * { visibility: visible; }
                    html, body { margin: 0 !important; padding: 0 !important; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .work-order-printable { position: absolute; left: 0; top: 0; width: 48mm; height: auto; font-family: 'monospace', 'Courier New', Courier; font-size: 7pt; color: #000; background: #fff; }
                    .no-print { display: none !important; }
                }
                @page {
                    size: 48mm auto;
                    margin: 0;
                }
            `}</style>

            <div className="bg-white text-black p-1 font-mono max-w-[48mm] mx-auto work-order-printable">
                <header className="text-center mb-1">
                    <LogoComponent className="mx-auto w-8 h-8 rounded-full mb-1" />
                    <h1 className="text-sm font-bold">Levist Uniforms</h1>
                    <p className="text-[10px] leading-tight">Matamoros, Tamaulipas</p>
                    <p className="mt-1 font-semibold text-xs">Orden de Trabajo</p>
                    <p className="font-semibold text-xs">PRODUCCIÓN / TALLER</p>
                </header>

                <section className="my-1 text-[10px] space-y-0.5 leading-tight">
                    <p><b>No. Orden:</b> {details.order_id.slice(0, 8)}</p>
                    <p><b>Fecha:</b> {new Date(details.order_date).toLocaleString('es-MX', { timeZone: 'America/Matamoros' })}</p>
                    <p><b>Vendedor:</b> {details.seller_name || 'N/A'}</p>
                    <p><b>CLIENTE:</b></p>
                    <p className="font-black text-xs pl-2">{details.customer_name || 'MOSTRADOR'}</p>
                </section>

                {/* Sección destacada para la escuela */}
                {details.school_name && (
                    <section className="my-1 p-1 border-2 border-black rounded-sm bg-blue-50">
                        <p className="text-center font-black text-xs uppercase">ESCUELA:</p>
                        <p className="text-center font-bold text-sm uppercase">{details.school_name}</p>
                    </section>
                )}

                {details.embroidery_notes && (
                    <section className="my-1 p-1 border border-black rounded-sm bg-white">
                        <h2 className="font-bold text-xs mb-0.5">Instrucciones:</h2>
                        <p className="text-[10px] whitespace-pre-wrap font-bold">{details.embroidery_notes}</p>
                    </section>
                )}

                <footer className="mt-2 flex justify-center">
                    <div className="w-20 h-20 bg-white p-0.5">
                        <QRCode 
                            value={details.order_id} 
                            size={128} 
                            style={{ height: "auto", maxWidth: "100%", width: "100%" }} 
                            viewBox={`0 0 256 256`}
                        />
                    </div>
                </footer>
            </div>
        </>
    );
}

// Página principal
export default function WorkOrderPage({ params }: { params: Promise<{ id: string }> }) {
    const [workOrderDetails, setWorkOrderDetails] = useState<OrderDetailsForWorkOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                const { id } = await params;
                const details = await getWorkOrderDetails(id);
                if (details) {
                    setWorkOrderDetails(details);
                } else {
                    setError(true);
                }
            } catch (err) {
                console.error('Error loading work order details:', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [params]);

    useEffect(() => {
        // Auto-imprimir cuando se abre desde el botón de múltiples copias
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('autoprint') === 'true' && workOrderDetails) {
            const timer = setTimeout(() => {
                window.print();
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [workOrderDetails]);

    if (loading) {
        return (
            <div className="bg-gray-100 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando orden de trabajo...</p>
                </div>
            </div>
        );
    }

    if (error || !workOrderDetails) {
        return (
            <div className="bg-gray-100 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">Error: No se pudo cargar la orden de trabajo</p>
                    <button 
                        onClick={() => window.close()} 
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                    >
                        Cerrar ventana
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-100 min-h-screen">
            <div className="no-print text-center p-4">
                <button 
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    🖨️ Imprimir Orden de Trabajo
                </button>
                <p className="text-sm text-gray-600 mt-2">Esta página se imprimirá automáticamente cuando se abra desde múltiples copias</p>
            </div>

            <WorkOrderTicket details={workOrderDetails} />
        </div>
    );
}
