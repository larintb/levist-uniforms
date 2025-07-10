// Componente temporal para debug del sistema de separado
// Agrega este componente a tu página de órdenes temporalmente para probar

"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function LayawayDebugComponent() {
    const [orderId, setOrderId] = useState('');
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();

    const testCompletePayment = async () => {
        if (!orderId.trim()) {
            setResult('Error: Ingresa un ID de orden');
            return;
        }

        setIsLoading(true);
        try {
            // Probar la función RPC directamente
            const { data, error } = await supabase
                .rpc('complete_layaway_payment', {
                    p_order_id: orderId.trim()
                });

            if (error) {
                setResult(`Error RPC: ${error.message}`);
            } else {
                setResult(`Resultado: ${JSON.stringify(data, null, 2)}`);
            }
        } catch (err) {
            setResult(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const checkOrderData = async () => {
        if (!orderId.trim()) {
            setResult('Error: Ingresa un ID de orden');
            return;
        }

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('id, is_layaway, down_payment, remaining_balance, status, total')
                .eq('id', orderId.trim())
                .single();

            if (error) {
                setResult(`Error consulta: ${error.message}`);
            } else {
                setResult(`Datos de la orden: ${JSON.stringify(data, null, 2)}`);
            }
        } catch (err) {
            setResult(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-yellow-100 p-4 rounded-lg border border-yellow-300 m-4">
            <h3 className="font-bold text-yellow-800 mb-4">🔧 Debug Sistema de Separado</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-yellow-800 mb-1">
                        ID de Orden para Probar:
                    </label>
                    <input 
                        type="text" 
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                        className="w-full p-2 border border-yellow-300 rounded"
                        placeholder="Ingresa UUID de una orden separado"
                    />
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={checkOrderData}
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        Consultar Datos
                    </button>
                    <button 
                        onClick={testCompletePayment}
                        disabled={isLoading}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                        Completar Pago (RPC)
                    </button>
                </div>
                {result && (
                    <div className="mt-4 p-3 bg-gray-100 border rounded">
                        <pre className="text-sm overflow-auto">{result}</pre>
                    </div>
                )}
            </div>
        </div>
    );
}
