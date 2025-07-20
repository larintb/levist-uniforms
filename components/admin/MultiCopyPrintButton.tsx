"use client";

import React, { useState } from 'react';

interface MultiCopyPrintButtonProps {
    orderId: string;
    orderHasEmbroidery?: boolean;
    className?: string;
    buttonText?: string;
    showIcons?: boolean;
}

export function MultiCopyPrintButton({ 
    orderId, 
    orderHasEmbroidery = false,
    className = "p-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors",
    buttonText = "",
    showIcons = true
}: MultiCopyPrintButtonProps) {
    const [showModal, setShowModal] = useState(false);
    const [copies, setCopies] = useState(orderHasEmbroidery ? 2 : 1);

    const handlePrint = () => {
        setShowModal(true);
    };

    const handleConfirmPrint = () => {
        // Abrir múltiples ventanas para imprimir solo la orden de trabajo
        for (let i = 0; i < copies; i++) {
            setTimeout(() => {
                const printWindow = window.open(`/admin/orders/${orderId}/work-order?autoprint=true`, '_blank');
                // Auto-imprimir después de cargar
                if (printWindow) {
                    printWindow.addEventListener('load', () => {
                        setTimeout(() => {
                            printWindow.print();
                        }, 1000);
                    });
                }
            }, i * 1000); // Delay mayor para dar tiempo a que se abra cada ventana
        }
        setShowModal(false);
    };

    const PrintIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h.942c.576 0 1.042-.465 1.042-1.042 0-.576-.466-1.042-1.042-1.042H17.66m0 0H6.34m11.32 0c.576 0 1.042-.465 1.042-1.042 0-.576-.466-1.042-1.042-1.042M12 15.75h.007v.008H12v-.008Z" />
        </svg>
    );

    const CopyIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 16.5 4.125H15" />
        </svg>
    );

    return (
        <>
            <button
                onClick={handlePrint}
                className={className}
                title="Imprimir múltiples órdenes de trabajo"
            >
                {showIcons ? (
                    <div className="flex items-center gap-2">
                        <PrintIcon />
                        <CopyIcon />
                        {buttonText && <span>{buttonText}</span>}
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <PrintIcon />
                        <span>{buttonText || "Imprimir Múltiples Copias"}</span>
                    </div>
                )}
            </button>

            {/* Modal para seleccionar número de copias */}
            {showModal && (
                <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
                    <div className="bg-white p-6 rounded-lg shadow-xl border-2 border-gray-300 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-4 text-gray-900 flex items-center gap-2">
                            <PrintIcon />
                            Imprimir Órdenes de Trabajo
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Se imprimirán múltiples copias de la <strong>orden de trabajo</strong> solamente 
                            (sin el ticket de venta). Ideal para distribuir en el taller.
                        </p>
                        
                        <div className="mb-6">
                            <label htmlFor="copies" className="block text-sm font-medium text-gray-700 mb-2">
                                Número de copias a imprimir:
                            </label>
                            <div className="flex items-center justify-center space-x-4">
                                <button
                                    type="button"
                                    onClick={() => setCopies(Math.max(1, copies - 1))}
                                    className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 font-bold text-lg"
                                >
                                    -
                                </button>
                                <div className="flex flex-col items-center">
                                    <input
                                        type="number"
                                        id="copies"
                                        min="1"
                                        max="10"
                                        value={copies}
                                        onChange={(e) => setCopies(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                                        className="w-20 text-center border border-gray-300 rounded-md py-2 text-gray-900 text-lg font-semibold"
                                    />
                                    <span className="text-xs text-gray-500 mt-1">
                                        {copies === 1 ? 'copia' : 'copias'}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setCopies(Math.min(10, copies + 1))}
                                    className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 font-bold text-lg"
                                >
                                    +
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 text-center">Máximo 10 copias por impresión</p>
                        </div>

                        {/* Sugerencias basadas en el contexto */}
                        {orderHasEmbroidery && (
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-start gap-2">
                                    <div className="w-4 h-4 text-blue-500 mt-0.5">
                                        💡
                                    </div>
                                    <div>
                                        <p className="text-sm text-blue-800 font-medium">Sugerencia:</p>
                                        <p className="text-xs text-blue-700">
                                            Esta orden incluye bordado. Se recomienda imprimir al menos 2 copias: 
                                            una para el taller y otra como respaldo.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmPrint}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                            >
                                <PrintIcon />
                                Imprimir {copies} orden{copies === 1 ? '' : 'es'} de trabajo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
