// admin/pos/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// --- Tipos de Datos ---
interface School {
    id: string;
    name: string;
}

interface InventoryItem {
    inventory_id: string;
    product_id: string;
    product_name: string;
    image_url: string;
    size: string;
    color: string;
    price: number;
    stock: number;
    barcode: string;
}

type FindResult = {
    success: boolean;
    data?: InventoryItem;
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

type SpecialOrderData = {
    isSpecialOrder: boolean;
    customerName?: string;
    customerPhone?: string;
    schoolId?: string | null;
    embroideryNotes?: string;
};

export type SalePayload = {
    cartItems: CartItemForAction[];
    paymentMethod: string;
    specialOrderData: SpecialOrderData;
    requiresInvoice: boolean;
};

// --- Acción para obtener la lista de escuelas ---
export async function getSchools(): Promise<School[]> {
    // FIX: createClient() in your project is asynchronous and MUST be awaited.
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('schools')
        .select('id, name')
        .order('name', { ascending: true });

    if (error) {
        console.error("Error fetching schools:", error);
        return [];
    }
    return data as School[];
}

// --- Acción para buscar productos ---
export async function findProductByBarcode(barcode: string): Promise<FindResult> {
    if (!barcode) {
        return { success: false, message: "El código de barras no puede estar vacío." };
    }

    // FIX: createClient() in your project is asynchronous and MUST be awaited.
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

        return { success: true, data: data as InventoryItem };

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.error('Error en findProductByBarcode:', errorMessage);
        return { success: false, message: "Error de conexión con la base de datos." };
    }
}

// --- Acción para procesar la venta ---
export async function processSaleAction(payload: SalePayload): Promise<SaleResult> {
    const { cartItems, paymentMethod, specialOrderData, requiresInvoice } = payload;

    if (!cartItems || cartItems.length === 0) {
        return { success: false, message: "El carrito no puede estar vacío." };
    }
    if (!paymentMethod) {
        return { success: false, message: "Debe seleccionar un método de pago." };
    }
    if (specialOrderData.isSpecialOrder && !specialOrderData.customerName) {
        return { success: false, message: "El nombre del cliente es obligatorio para pedidos especiales." };
    }

    // FIX: createClient() in your project is asynchronous and MUST be awaited.
    const supabase = await createClient();
    
    const rpcParams = {
        p_cart_items: cartItems,
        p_payment_method: paymentMethod,
        p_status: specialOrderData.isSpecialOrder ? 'PENDING_EMBROIDERY' : 'COMPLETED',
        p_customer_name: specialOrderData.isSpecialOrder ? specialOrderData.customerName : 'Cliente Mostrador',
        p_customer_phone: specialOrderData.customerPhone || null,
        p_school_id: specialOrderData.schoolId || null,
        p_embroidery_notes: specialOrderData.embroideryNotes || null,
        p_requires_invoice: requiresInvoice
    };

    try {
        const { data: newOrderId, error } = await supabase.rpc('process_sale', rpcParams);

        if (error) {
            console.error("Error desde RPC process_sale:", error);
            return { success: false, message: `Error al procesar la venta: ${error.message}` };
        }
        
        revalidatePath('/admin/products');
        revalidatePath('/admin/orders');
        revalidatePath('/admin/dashboard');

        return { success: true, orderId: newOrderId, message: "Venta registrada con éxito." };

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.error("Error catastrófico en processSaleAction:", errorMessage);
        return { success: false, message: "Ocurrió un error inesperado en el servidor." };
    }
}
