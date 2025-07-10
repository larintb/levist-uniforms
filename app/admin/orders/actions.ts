// app/admin/orders/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type ActionResult = {
    success: boolean;
    message: string;
};

// Acción para llamar a la función de la DB que actualiza el estado de la orden
export async function updateOrderStatus(orderId: string, newStatus: string): Promise<ActionResult> {
    if (!orderId || !newStatus) {
        return { success: false, message: "Faltan datos para actualizar la orden." };
    }

    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('update_order_status', {
            p_order_id: orderId,
            p_new_status: newStatus
        });

        if (error) {
            console.error("Error updating order status:", error);
            return { success: false, message: `Error: ${error.message}` };
        }

        // La función RPC devuelve un JSON con success y message
        if (data && typeof data === 'object' && 'success' in data) {
            if (data.success) {
                // Revalida las rutas para que los cambios se reflejen inmediatamente
                revalidatePath('/admin/orders');
                revalidatePath(`/admin/orders/${orderId}`);
                
                // Si el nuevo estado es 'COMPLETED', también revalidamos los productos para reflejar el stock
                if (newStatus === 'COMPLETED') {
                    revalidatePath('/admin/products');
                    revalidatePath('/admin/dashboard');
                }
                
                return { success: true, message: data.message || "Estado de la orden actualizado con éxito." };
            } else {
                return { success: false, message: data.message || "Error al actualizar el estado de la orden." };
            }
        }

        return { success: true, message: "Estado de la orden actualizado con éxito." };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.error("Error catastrófico en updateOrderStatus:", errorMessage);
        return { success: false, message: "Ocurrió un error inesperado en el servidor." };
    }
}

// Acción para completar el pago de un separado
export async function completeLayawayPayment(orderId: string): Promise<ActionResult> {
    if (!orderId) {
        return { success: false, message: "Falta el ID de la orden." };
    }

    const supabase = await createClient();

    try {
        // Usar la función RPC para completar el pago
        const { data, error } = await supabase
            .rpc('complete_layaway_payment', {
                p_order_id: orderId
            });

        if (error) {
            console.error("Error completing layaway payment:", error);
            return { success: false, message: `Error: ${error.message}` };
        }

        // La función RPC devuelve un JSON con success y message
        if (data && typeof data === 'object' && 'success' in data) {
            if (data.success) {
                // Revalida las rutas para que los cambios se reflejen inmediatamente
                revalidatePath('/admin/orders');
                revalidatePath(`/admin/orders/${orderId}`);
                revalidatePath('/admin/products');
                revalidatePath('/admin/dashboard');
                
                return { success: true, message: data.message || "Pago del separado completado con éxito." };
            } else {
                return { success: false, message: data.message || "Error al completar el pago del separado." };
            }
        }

        return { success: true, message: "Pago del separado completado con éxito." };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.error("Error catastrófico en completeLayawayPayment:", errorMessage);
        return { success: false, message: "Ocurrió un error inesperado en el servidor." };
    }
}