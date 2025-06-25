"use client";

import React, { useTransition } from "react";
import { updateOrderStatus } from "@/app/admin/orders/actions";

export function UpdateStatusForm({ orderId, currentStatus }: { orderId: string, currentStatus: string }) {
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = React.useState<{ text: string; type: 'error' | 'success' } | null>(null);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setMessage(null);
        const formData = new FormData(event.currentTarget);
        const newStatus = formData.get("status") as string;

        startTransition(async () => {
            const result = await updateOrderStatus(orderId, newStatus);
            if (result.success) {
                setMessage({ text: result.message, type: 'success' });
            } else {
                setMessage({ text: result.message, type: 'error' });
            }
        });
    };

    const statuses = [
        'PENDING_EMBROIDERY',
        'PENDING_SUPPLIER',
        'READY_FOR_PICKUP',
        'COMPLETED',
        'DELIVERED',
    ];

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-gray-50 rounded-lg border">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Cambiar estado del pedido</label>
            <div className="mt-1 flex items-center space-x-2">
                <select
                    id="status"
                    name="status"
                    defaultValue={currentStatus}
                    className="text-gray-900 flex-grow block w-full pl-3 pr-10 py-2 text-base border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                    {statuses.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
                <button
                    type="submit"
                    disabled={isPending}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
                >
                    {isPending ? 'Actualizando...' : 'Actualizar'}
                </button>
            </div>
            {message && <p className={`mt-2 text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{message.text}</p>}
        </form>
    );
}