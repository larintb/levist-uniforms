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

    const { error } = await supabase.rpc('update_order_status', {
        p_order_id: orderId,
        p_new_status: newStatus
    });

    if (error) {
        console.error("Error updating order status:", error);
        // Devuelve el mensaje de error de la base de datos (ej. "stock insuficiente")
        return { success: false, message: `Error: ${error.message}` };
    }

    // Revalida las rutas para que los cambios se reflejen inmediatamente
    revalidatePath('/admin/orders');
    revalidatePath(`/admin/orders/${orderId}`);

    // Si el nuevo estado es 'COMPLETED', también revalidamos los productos para reflejar el stock
    if (newStatus === 'COMPLETED') {
        revalidatePath('/admin/products');
        revalidatePath('/admin/dashboard');
    }

    return { success: true, message: "Estado de la orden actualizado con éxito." };
}