// @/app/admin/orders/[id]/NotifyCustomerButton.tsx
'use client';

import React, { useState, useTransition } from 'react';
import { sendWhatsAppNotification } from './actions';

// Icono SVG de WhatsApp
const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99 0-3.903-.52-5.586-1.459l-6.353 1.687a.499.499 0 01-.622-.624zM7.485 17.521c.826.52 1.785.815 2.791.815 5.392 0 9.81-4.418 9.81-9.811 0-5.392-4.418-9.81-9.81-9.81-5.392 0-9.81 4.418-9.81 9.81 0 2.05.632 4.008 1.787 5.666l-1.011 3.697 3.829-1.012zm5.41-12.434c.482-.479 1.134-.479 1.615 0l.083.083c.479.482.479 1.134 0 1.615l-3.263 3.263.083.083 3.263-3.263c.482-.479 1.134-.479 1.615 0l.083.083c.479.482.479 1.134 0 1.615l-4.928 4.928c-.482.479-1.134.479-1.615 0l-.083-.083c-.479-.482-.479-1.134 0-1.615l3.263-3.263-.083-.083-3.263 3.263c-.482.479-1.134.479-1.615 0l-.083-.083c-.479-.482-.479-1.134 0-1.615l4.928-4.928z"/>
    </svg>
);

interface NotifyButtonProps {
    customerName: string;
    customerPhone: string | null;
    orderId: string; // Añadimos el ID de la orden como prop
}

export const NotifyCustomerButton = ({ customerName, customerPhone, orderId }: NotifyButtonProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    if (!customerPhone) {
        return (
            <button
                type="button"
                disabled
                className="mt-4 w-full flex items-center justify-center gap-2 rounded-md bg-gray-300 px-3 py-2 text-sm font-semibold text-gray-500 cursor-not-allowed"
                title="No hay número de teléfono registrado para este cliente."
            >
                <WhatsAppIcon />
                Notificar (Teléfono no disponible)
            </button>
        );
    }
    
    const handleSendNotification = () => {
        startTransition(async () => {
            try {
                // Pasamos el orderId a la server action
                const result = await sendWhatsAppNotification(customerPhone, customerName, orderId);
                if (result.success) {
                    alert(`Éxito: ${result.message}`); // Puedes reemplazar alert por un toast más elegante
                } else {
                    alert(`Error: ${result.message}`);
                }
                setIsModalOpen(false);
            } catch (error) {
                console.error('Error sending notification:', error);
                alert('Error: No se pudo enviar la notificación');
                setIsModalOpen(false);
            }
        });
    };

    const handleCloseModal = () => {
        if (!isPending) {
            setIsModalOpen(false);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="mt-4 w-full flex items-center justify-center gap-2 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 transition-colors"
            >
                <WhatsAppIcon />
                Notificar para Recoger
            </button>
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 m-4 max-w-sm w-full ring-1 ring-gray-900/10">
                        <h3 className="text-lg font-bold text-gray-900">Confirmar Envío</h3>
                        <p className="mt-2 text-sm text-gray-700">
                            Se enviará una notificación para el pedido <span className="font-semibold">#{orderId.slice(0, 8)}</span> a <span className="font-semibold">{customerName}</span>.
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button 
                                type="button" 
                                onClick={handleCloseModal} 
                                disabled={isPending} 
                                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="button" 
                                onClick={handleSendNotification} 
                                disabled={isPending} 
                                className="rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50 disabled:bg-green-400 flex items-center gap-2"
                            >
                                {isPending ? 'Enviando...' : 'Sí, enviar notificación'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};