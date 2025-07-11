"use client";

import React, { useState } from 'react';

interface PrintTicketButtonProps {
    orderId?: string;
    className?: string;
    showCopiesSelector?: boolean;
}

export function PrintTicketButton({ 
    orderId, 
    className = "px-4 py-2 h-10 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500",
    showCopiesSelector = false 
}: PrintTicketButtonProps) {
    const [showModal, setShowModal] = useState(false);
    const [copies, setCopies] = useState(1);

    const handlePrint = () => {
        if (showCopiesSelector) {
            setShowModal(true);
        } else {
            window.print();
        }
    };

    const handleConfirmPrint = () => {
        if (orderId) {
            // Abrir múltiples ventanas para imprimir
            for (let i = 0; i < copies; i++) {
                setTimeout(() => {
                    window.open(`/admin/orders/${orderId}`, '_blank');
                }, i * 100); // Pequeño delay entre ventanas para evitar bloqueo del navegador
            }
        } else {
            // Imprimir la página actual múltiples veces
            for (let i = 0; i < copies; i++) {
                setTimeout(() => {
                    window.print();
                }, i * 100);
            }
        }
        setShowModal(false);
        setCopies(1);
    };

    return (
        <>
            <button
                onClick={handlePrint}
                className={className}
            >
                Imprimir Ticket
            </button>

            {/* Modal para seleccionar número de copias */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
                        <h3 className="text-lg font-bold mb-4 text-gray-900">Número de Copias</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            ¿Cuántas copias del recibo desea imprimir?
                        </p>
                        <div className="mb-6">
                            <label htmlFor="copies" className="block text-sm font-medium text-gray-700 mb-2">
                                Cantidad de copias:
                            </label>
                            <div className="flex items-center space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setCopies(Math.max(1, copies - 1))}
                                    className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 font-bold"
                                >
                                    -
                                </button>
                                <input
                                    type="number"
                                    id="copies"
                                    min="1"
                                    max="10"
                                    value={copies}
                                    onChange={(e) => setCopies(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                                    className="w-16 text-center border border-gray-300 rounded-md py-1 text-gray-900"
                                />
                                <button
                                    type="button"
                                    onClick={() => setCopies(Math.min(10, copies + 1))}
                                    className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 font-bold"
                                >
                                    +
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Máximo 10 copias</p>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setCopies(1);
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmPrint}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                Imprimir {copies} {copies === 1 ? 'copia' : 'copias'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}