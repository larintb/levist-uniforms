// @/app/admin/pos/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// --- Tipos de Datos ---

// Tipos para la nueva función getGroupedProducts
export type ProductVariant = {
    size: string;
    price: number;
    stock: number;
    inventory_id: string;
    barcode: string;
};

export type ProductColorVariant = {
    color: string;
    image_url: string | null;
    variants: ProductVariant[];
};

export type GroupedProduct = {
    sku_base: string;
    product_name: string;
    colors: ProductColorVariant[];
};


// Tipos existentes
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
    subtotal: number;
    discountAmount: number;
    discountReason: string;
    total: number;
    isLayaway: boolean;
    downPayment: number;
    remainingBalance: number;
};

// --- Acciones del Servidor ---

/**
 * NUEVA ACCIÓN: Obtiene todos los productos disponibles y los agrupa por sku_base,
 * luego por color, para alimentar el nuevo selector de productos interactivo.
 */
export async function getGroupedProducts(): Promise<GroupedProduct[]> {
    const supabase = await createClient();

    // Esta consulta obtiene todas las variantes de inventario y las une con sus productos y colores.
    const { data, error } = await supabase
        .from('inventory')
        .select(`
            id,
            size,
            stock,
            price,
            barcode,
            product_variants (
                id,
                color,
                image_url,
                products (
                    id,
                    name,
                    sku_base
                )
            )
        `)
        .gt('stock', 0) // Solo productos con stock
        .order('size', { ascending: true });

    if (error) {
        console.error("Error fetching grouped products:", error);
        return [];
    }

    // Procesamos los datos planos en una estructura anidada y agrupada
    const productMap = new Map<string, GroupedProduct>();

    for (const item of data) {
        // @ts-expect-error: Ignoramos temporalmente el tipado complejo de Supabase
        if (item.product_variants && item.product_variants.products) {
            // @ts-expect-error: Ignoramos temporalmente el tipado complejo de Supabase
            const productBase = item.product_variants.products;
            const sku = productBase.sku_base;

            // Si el producto base no está en el mapa, lo agregamos
            if (!productMap.has(sku)) {
                productMap.set(sku, {
                    sku_base: sku,
                    product_name: productBase.name,
                    colors: [],
                });
            }

            const groupedProduct = productMap.get(sku)!;
            // @ts-expect-error: Ignoramos temporalmente el tipado complejo de Supabase
            const color = item.product_variants.color;
            
            // Buscamos si el color ya existe para este producto
            let colorVariant = groupedProduct.colors.find(c => c.color === color);

            // Si el color no existe, lo agregamos
            if (!colorVariant) {
                colorVariant = {
                    color: color,
                    // @ts-expect-error: Ignoramos temporalmente el tipado complejo de Supabase
                    image_url: item.product_variants.image_url,
                    variants: [],
                };
                groupedProduct.colors.push(colorVariant);
            }

            // Agregamos la variante de talla/inventario al color correspondiente
            colorVariant.variants.push({
                inventory_id: item.id,
                size: item.size,
                stock: item.stock,
                price: item.price,
                barcode: item.barcode,
            });
        }
    }

    return Array.from(productMap.values());
}


// --- Acciones existentes (sin cambios) ---

export async function getSchools(): Promise<School[]> {
    const supabase = await createClient();
    const { data, error } = await supabase.from('schools').select('id, name').order('name', { ascending: true });
    if (error) { console.error("Error fetching schools:", error); return []; }
    return data as School[];
}

export async function findProductByBarcode(barcode: string): Promise<FindResult> {
    if (!barcode) { return { success: false, message: "El código de barras no puede estar vacío." }; }
    const supabase = await createClient();
    try {
        const { data, error } = await supabase.from('full_inventory_details').select('inventory_id, product_id, product_name, image_url, size, color, price, stock, barcode').eq('barcode', barcode).single();
        if (error) {
            if (error.code === 'PGRST116') return { success: false, message: "Código de barras no encontrado." };
            throw error;
        }
        if (data.stock <= 0) return { success: false, message: "Producto sin stock." };
        return { success: true, data: data as InventoryItem };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.error('Error en findProductByBarcode:', errorMessage);
        return { success: false, message: "Error de conexión con la base de datos." };
    }
}

export async function processSaleAction(payload: SalePayload): Promise<SaleResult> {
    const { cartItems, paymentMethod, specialOrderData, requiresInvoice, subtotal, discountAmount, discountReason, total, isLayaway, downPayment, remainingBalance } = payload;
    if (!cartItems || cartItems.length === 0) return { success: false, message: "El carrito no puede estar vacío." };
    if (!paymentMethod) return { success: false, message: "Debe seleccionar un método de pago." };
    if (specialOrderData.isSpecialOrder && !specialOrderData.customerName) return { success: false, message: "El nombre del cliente es obligatorio para pedidos especiales." };
    if (isLayaway && downPayment <= 0) return { success: false, message: "El anticipo debe ser mayor a $0 para separados." };
    if (isLayaway && downPayment > total) return { success: false, message: "El anticipo no puede ser mayor al total." };
    
    const supabase = await createClient();
    
    // Determinar el estado de la orden basado en si es separado o no
    let orderStatus = 'COMPLETED';
    if (specialOrderData.isSpecialOrder) {
        orderStatus = 'PENDING_EMBROIDERY';
    }
    if (isLayaway) {
        orderStatus = remainingBalance > 0 ? 'PENDING_PAYMENT' : 'COMPLETED';
    }
    
    const rpcParams = {
        p_cart_items: cartItems,
        p_payment_method: paymentMethod,
        p_status: orderStatus,
        p_customer_name: specialOrderData.isSpecialOrder ? specialOrderData.customerName : 'Cliente Mostrador',
        p_customer_phone: specialOrderData.customerPhone || null,
        p_school_id: specialOrderData.schoolId || null,
        p_embroidery_notes: specialOrderData.embroideryNotes || null,
        p_requires_invoice: requiresInvoice,
        p_subtotal: subtotal,
        p_discount_amount: discountAmount,
        p_discount_reason: discountReason,
        p_total: total,
        p_is_layaway: isLayaway,
        p_down_payment: downPayment,
        p_remaining_balance: remainingBalance
    };
    try {
        const { data: newOrderId, error } = await supabase.rpc('process_sale', rpcParams);
        if (error) { console.error("Error desde RPC process_sale:", error); return { success: false, message: `Error al procesar la venta: ${error.message}` }; }
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
