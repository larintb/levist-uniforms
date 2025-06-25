// admin/pos/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// --- Tipos de Datos ---
type FindResult = {
    success: boolean;
    data?: any;
    message?: string;
};

// --- MODIFICADO ---
// Un único tipo para el resultado de la venta
type SaleResult = {
    success: boolean;
    orderId?: string;
    message?: string;
};

// Tipo para los items del carrito que vienen del cliente
type CartItemForAction = {
    inventory_id: string;
    quantity: number;
    price_at_sale: number;
};

// --- NUEVO ---
// Tipo para los datos del pedido especial. Todos los campos son opcionales.
type SpecialOrderData = {
    isSpecialOrder: boolean;
    customerName?: string;
    customerPhone?: string;
    schoolId?: string | null;
    embroideryNotes?: string;
};

// --- NUEVO ---
// Un tipo de payload unificado para la acción de venta.
export type SalePayload = {
    cartItems: CartItemForAction[];
    paymentMethod: string;
    specialOrderData: SpecialOrderData;
};

// --- NUEVO ---
// Acción para obtener la lista de escuelas
export async function getSchools() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('schools')
        .select('id, name')
        .order('name', { ascending: true });

    if (error) {
        console.error("Error fetching schools:", error);
        return [];
    }
    return data;
}

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

// --- MODIFICADO ---
// Se reemplaza la antigua 'processSale' por esta acción más completa y flexible.
export async function processSaleAction(payload: SalePayload): Promise<SaleResult> {
    const { cartItems, paymentMethod, specialOrderData } = payload;

    if (!cartItems || cartItems.length === 0) {
        return { success: false, message: "El carrito no puede estar vacío." };
    }
    if (!paymentMethod) {
        return { success: false, message: "Debe seleccionar un método de pago." };
    }
    if (specialOrderData.isSpecialOrder && !specialOrderData.customerName) {
        return { success: false, message: "El nombre del cliente es obligatorio para pedidos especiales." };
    }

    const supabase = await createClient();

    // Construimos los parámetros para la función de la base de datos
    const rpcParams = {
        p_cart_items: cartItems,
        p_payment_method: paymentMethod,
        // Lógica condicional para los datos del pedido especial
        p_status: specialOrderData.isSpecialOrder ? 'PENDING_EMBROIDERY' : 'COMPLETED',
        p_customer_name: specialOrderData.isSpecialOrder ? specialOrderData.customerName : 'Cliente Mostrador',
        p_customer_phone: specialOrderData.customerPhone || null,
        p_school_id: specialOrderData.schoolId || null,
        p_embroidery_notes: specialOrderData.embroideryNotes || null
    };

    try {
        // Llamamos a la función de base de datos 'process_sale'
        const { data: newOrderId, error } = await supabase.rpc('process_sale', rpcParams);

        if (error) {
            console.error("Error desde RPC process_sale:", error);
            return { success: false, message: `Error al procesar la venta: ${error.message}` };
        }
        
        // Revalidamos rutas para que los datos se actualicen en la app
        revalidatePath('/admin/products');
        revalidatePath('/admin/orders');
        revalidatePath('/admin/dashboard');

        return { success: true, orderId: newOrderId, message: "Venta registrada con éxito." };

    } catch (e: any) {
        console.error("Error catastrófico en processSaleAction:", e.message);
        return { success: false, message: "Ocurrió un error inesperado en el servidor." };
    }
}