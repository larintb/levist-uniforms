"use client";

import React from "react";
import Image from "next/image";
import QRCode from "react-qr-code";
import { Encargo } from "@/app/admin/encargos/actions";

interface EncargoTicketProps {
    encargo: Encargo;
}

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
            alt="Levist Uniforms"
            width={40}
            height={40}
            className={className}
            onError={() => setImageError(true)}
        />
    );
};

const PrintIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6 18.25m10.56-4.421c.24.03.48.062.72.096m-.72-.096L18 18.25m-12 0h12M12 15V9m0 2.25a.75.75 0 0 0-.75.75v4.5a.75.75 0 0 0 1.5 0v-4.5A.75.75 0 0 0 12 11.25Z" />
    </svg>
);

export function EncargoTicket({ encargo }: EncargoTicketProps) {
    const total = encargo.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const remaining = total - encargo.deposit;

    return (
        <div className="bg-gray-100 p-4">
            <style jsx global>{`
                @media print {
                    body * { visibility: hidden; }
                    .printable-encargo, .printable-encargo * { visibility: visible; }
                    html, body { margin: 0 !important; padding: 0 !important; background: #fff; }
                    .printable-encargo { position: absolute; left: 0; top: 0; width: 80mm; height: auto; font-family: 'Verdana', 'Tahoma', 'Arial', sans-serif; font-size: 10pt; color: #000; background: #fff; }
                    .no-print { display: none !important; }
                }
            `}</style>

            <div className="no-print text-center mb-6">
                <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <PrintIcon className="h-5 w-5" />
                    Imprimir Ticket
                </button>
            </div>

            <div className="printable-encargo bg-white text-black p-1" style={{ fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif' }}>
                <header className="text-center mb-1">
                    <LogoComponent className="mx-auto w-8 h-8 rounded-full mb-1" />
                    <h1 className="text-sm font-bold">Levist Uniforms</h1>
                    <p className="text-[10px] leading-tight">Matamoros, Tamaulipas</p>
                    <div className="mt-1 px-2 py-0.5 bg-gray-100 rounded font-bold text-xs tracking-wide">
                        ENCARGO
                    </div>
                </header>

                <section className="my-1 leading-tight space-y-0.5">
                    <p className="font-black text-xs"><b>No. Encargo:</b> {encargo.id.slice(0, 8)}</p>
                    <p className="font-black text-xs">
                        <b>Fecha:</b>{" "}
                        {new Date(encargo.created_at).toLocaleString("es-MX", { timeZone: "America/Matamoros" })}
                    </p>
                    {encargo.seller_name && (
                        <p className="font-black text-xs"><b>Vendedor:</b> {encargo.seller_name}</p>
                    )}
                    <p className="font-black text-xs"><b>CLIENTE:</b></p>
                    <p className="font-black text-xs pl-2">{encargo.customer_name}</p>
                    {encargo.customer_phone && (
                        <p className="font-black text-xs pl-2">Tel: {encargo.customer_phone}</p>
                    )}
                    {encargo.school_name && (
                        <p className="font-black text-xs"><b>Escuela:</b> {encargo.school_name}</p>
                    )}
                </section>

                {encargo.embroidery_notes && (
                    <section className="my-1 p-1 border border-black rounded-sm">
                        <p className="font-black text-xs"><b>Notas:</b></p>
                        <p className="font-black text-xs whitespace-pre-wrap">{encargo.embroidery_notes}</p>
                    </section>
                )}

                <section className="border-t border-b border-dashed border-black py-1 my-1">
                    <div className="flex font-black text-xs mb-1">
                        <div className="flex-grow pr-1">PRODUCTO</div>
                        <div className="w-12 text-right pr-1">C/U</div>
                        <div className="w-14 text-right">TOTAL</div>
                    </div>
                    <div className="border-b border-dashed border-black mb-1"></div>
                    {encargo.items.map((item, idx) => (
                        <div key={idx} className="mb-1.5">
                            <div className="font-black text-xs">{item.quantity}x {item.product_name}</div>
                            <div className="font-black text-[10px] text-gray-600">{item.size} | {item.color}</div>
                            <div className="flex justify-between font-black text-xs mt-0.5">
                                <span className="text-[10px] text-gray-500">${item.price.toFixed(2)}</span>
                                <span>${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        </div>
                    ))}
                </section>

                <section className="mt-1 space-y-0.5">
                    <div className="flex justify-between font-bold text-sm border-t border-dashed border-black pt-1">
                        <span>TOTAL ESTIMADO:</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                    {encargo.deposit > 0 && (
                        <>
                            <div className="flex justify-between font-black text-xs">
                                <span>Anticipo Pagado:</span>
                                <span>-${encargo.deposit.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-black text-xs border-t border-dashed border-black pt-0.5">
                                <span>Saldo Pendiente:</span>
                                <span className="font-bold">${remaining.toFixed(2)}</span>
                            </div>
                        </>
                    )}
                </section>

                <footer className="mt-2 pt-1 border-t border-dashed border-black flex flex-col items-center text-center">
                    <p className="font-black text-[10px] text-gray-600 mb-1">Producto pendiente de llegada</p>
                    <p className="font-black text-xs mb-1">¡Gracias por su preferencia!</p>
                    <div className="w-20 h-20 bg-white p-0.5">
                        <QRCode
                            value={encargo.id}
                            size={128}
                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                            viewBox="0 0 256 256"
                        />
                    </div>
                </footer>
            </div>
        </div>
    );
}
