"use server";

import { createClient } from "@/lib/supabase/server";

// --- Tipos de Datos ---
type ProductDetails = {
    inventory_id: string;
    product_id: string;
    product_name: string;
    is_available: boolean;
    color: string;
    image_url: string | null;
    sku: string;
    size: string;
    stock: number;
    price: string;
    brand: string;
    collection: string;
    category: string;
    barcode: string;
};

type OrderDetails = {
    order_id: string;
    order_date: string;
    order_total: string;
    order_status: string;
    payment_method: string;
    seller_name: string;
    customer_name: string;
    customer_phone: string;
    embroidery_notes: string | null;
    school_name: string | undefined;
    items: {
        item_id: string;
        product_name: string;
        sku: string;
        color: string;
        size: string;
        quantity: number;
        price_at_sale: string;
    }[];
};

type FullOrderDetailsRow = {
    order_id: string;
    order_date: string;
    order_total: string;
    order_status: string;
    payment_method: string;
    seller_name: string;
    customer_name: string;
    customer_phone: string;
    embroidery_notes: string | null;
    school_id: string | null;
    item_id: string;
    product_name: string;
    sku: string;
    color: string;
    size: string;
    quantity: number;
    price_at_sale: string;
};

type SearchResult = {
    success: boolean;
    type?: 'product' | 'order';
    data?: ProductDetails | OrderDetails;
    message?: string;
}

// --- Nueva acción para entrada de inventario ---
export async function addInventoryEntryAction(inventoryIds: string[]): Promise<{ success: boolean; message: string }> {
    if (!inventoryIds || inventoryIds.length === 0) {
        return { success: false, message: "La lista de productos no puede estar vacía." };
    }

    const supabase = await createClient();

    try {
        const { error } = await supabase.rpc('increment_inventory_stock', { p_inventory_ids: inventoryIds });

        if (error) {
            console.error("Error calling RPC increment_inventory_stock:", error);
            throw new Error("No se pudo actualizar el stock en la base de datos.");
        }

        return { success: true, message: `Se actualizó el stock para ${inventoryIds.length} productos.` };

    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Error desconocido al guardar la entrada.";
        console.error('Error en addInventoryEntryAction:', message);
        return { success: false, message: "Error al conectar con la base de datos para guardar la entrada." };
    }
}

export async function updateInventoryItemPrice(inventoryId: string, newPrice: number): Promise<{ success: boolean; message: string }> {
    if (!inventoryId || newPrice === undefined || newPrice < 0) {
        return { success: false, message: "Datos inválidos para actualizar el precio." };
    }

    const supabase = await createClient();

    try {
        const { error } = await supabase
            .from('inventory')
            .update({ price: newPrice })
            .eq('id', inventoryId);

        if (error) {
            console.error("Error updating price:", error);
            throw new Error("No se pudo actualizar el precio en la base de datos.");
        }

        return { success: true, message: "Precio actualizado correctamente." };

    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Error desconocido al actualizar el precio.";
        console.error('Error en updateInventoryItemPrice:', message);
        return { success: false, message: "Error al conectar con la base de datos para actualizar el precio." };
    }
}

function isUUID(term: string): boolean {
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return uuidRegex.test(term);
}

export async function searchAction(term: string): Promise<SearchResult> {
    if (!term || !term.trim()) {
        return { success: false, message: "El código no puede estar vacío." };
    }

    const supabase = await createClient();

    if (isUUID(term)) {
        try {
            // CORREGIDO: Removido .returns<>() que no existe en Supabase
            const { data, error } = await supabase
                .from('full_order_details')
                .select('*')
                .eq('order_id', term);
            
            if (error || !data || data.length === 0) {
                 if (error) console.error("Error fetching order:", error);
                 return { success: false, message: "Orden no encontrada." };
            }

            // CORREGIDO: Cast explícito a nuestro tipo
            const typedData = data as FullOrderDetailsRow[];
            const orderInfo = typedData[0];
            let schoolName: string | undefined = undefined;

            if (orderInfo.school_id) {
                // CORREGIDO: Removido .single<>() y manejado el tipado correctamente
                const { data: schoolData } = await supabase
                    .from('schools')
                    .select('name')
                    .eq('id', orderInfo.school_id)
                    .single();
                
                // CORREGIDO: Tipado seguro con verificación
                schoolName = (schoolData as { name: string } | null)?.name;
            }
            
            const orderDetails: OrderDetails = {
                order_id: orderInfo.order_id,
                order_date: orderInfo.order_date,
                order_total: orderInfo.order_total,
                order_status: orderInfo.order_status,
                payment_method: orderInfo.payment_method,
                seller_name: orderInfo.seller_name,
                customer_name: orderInfo.customer_name,
                customer_phone: orderInfo.customer_phone,
                embroidery_notes: orderInfo.embroidery_notes,
                school_name: schoolName,
                // CORREGIDO: Ahora typedData está correctamente tipado
                items: typedData.map(row => ({
                    item_id: row.item_id,
                    product_name: row.product_name,
                    sku: row.sku,
                    color: row.color,
                    size: row.size,
                    quantity: row.quantity,
                    price_at_sale: row.price_at_sale,
                })),
            };

            return { success: true, type: 'order', data: orderDetails };

        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Error desconocido al buscar la orden.";
            console.error('Error en la búsqueda de orden:', message);
            return { success: false, message: "Error al conectar con la base de datos." };
        }
    } else {
        try {
            // CORREGIDO: Removido .single<>() que no existe
            const { data, error } = await supabase
                .from('full_inventory_details')
                .select('*')
                .eq('barcode', term)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return { success: false, message: "Producto no encontrado." };
                }
                throw error;
            }

            // CORREGIDO: Cast explícito a ProductDetails
            const typedData = data as ProductDetails;
            return { success: true, type: 'product', data: typedData };

        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Error desconocido al buscar el producto.";
            console.error('Error en la búsqueda por código de barras:', message);
            return { success: false, message: "Error al conectar con la base de datos." };
        }
    }
}