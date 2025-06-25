"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// --- Tipos de Datos ---
type FindResult = {
    success: boolean;
    data?: any;
    message?: string;
};

type SaleResult = {
    success: boolean;
    orderId?: string;
    message?: string;
};

type CartItemForAction = {
    inventory_id: string;
    quantity: number;
    price_at_sale: number;
};

// --- Acción para buscar productos (sin cambios) ---
export async function findProductByBarcode(barcode: string): Promise<FindResult> {
    if (!barcode) {
        return { success: false, message: "El código de barras no puede estar vacío." };
    }

    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('full_inventory_details')
            .select('inventory_id, product_id, product_name, image_url, size, color, price, stock, barcode')
            .eq('barcode', barcode)
            .single();

        if (error) {
            if (error.code === 'PGRST116') { // No rows found
                return { success: false, message: "Código de barras no encontrado en el inventario." };
            }
            throw error;
        }

        if (data.stock <= 0) {
            return { success: false, message: "Producto sin stock disponible." };
        }

        return { success: true, data: data };

    } catch (e: any) {
        console.error('Error en findProductByBarcode:', e.message);
        return { success: false, message: "Error de conexión con la base de datos." };
    }
}

// --- ¡NUEVA ACCIÓN PARA PROCESAR LA VENTA! ---
export async function processSale(cartItems: CartItemForAction[], paymentMethod: string): Promise<SaleResult> {
    if (!cartItems || cartItems.length === 0) {
        return { success: false, message: "El carrito no puede estar vacío." };
    }
    if (!paymentMethod) {
        return { success: false, message: "Debe seleccionar un método de pago." };
    }

    const supabase = await createClient();

    try {
        // Llamamos a la función de base de datos 'process_sale' que creamos.
        // Esto asegura que toda la operación es atómica.
        const { data: newOrderId, error } = await supabase.rpc('process_sale', {
            p_cart_items: cartItems,
            p_payment_method: paymentMethod,
        });

        if (error) {
            // La base de datos nos devolverá un error si, por ejemplo, el stock es insuficiente.
            console.error("Error desde RPC process_sale:", error);
            return { success: false, message: `Error al procesar la venta: ${error.message}` };
        }
        
        // Si la venta es exitosa, revalidamos las rutas para que los datos se actualicen
        revalidatePath('/admin/products');
        revalidatePath('/admin/dashboard');

        return { success: true, orderId: newOrderId, message: "Venta registrada con éxito." };

    } catch (e: any) {
        console.error("Error catastrófico en processSale:", e.message);
        return { success: false, message: "Ocurrió un error inesperado en el servidor." };
    }
}
