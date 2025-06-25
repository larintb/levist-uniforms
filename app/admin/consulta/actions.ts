// En: @/app/admin/consulta/actions.ts

"use server";

import { createClient } from "@/lib/supabase/server";

// --- Tipos de Datos ---

// Tipo para un producto (el que ya tenías)
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

// Tipo para los detalles de una orden (basado en tu función)
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

// Tipo para la respuesta de nuestra nueva función
type SearchResult = {
    success: boolean;
    type?: 'product' | 'order';
    data?: ProductDetails | OrderDetails;
    message?: string;
}

// --- Funciones Auxiliares ---

// Una función simple para verificar si un string parece un UUID.
// Los IDs de Supabase suelen tener este formato.
function isUUID(term: string): boolean {
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return uuidRegex.test(term);
}

// --- Acción Principal del Servidor ---

export async function searchAction(term: string): Promise<SearchResult> {
    if (!term || !term.trim()) {
        return { success: false, message: "El código no puede estar vacío." };
    }

    const supabase = await createClient();

    // Si el término parece un ID de orden, buscamos la orden.
    if (isUUID(term)) {
        try {
            const { data, error } = await supabase
                .from('full_order_details')
                .select('*')
                .eq('order_id', term);

            if (error || !data || data.length === 0) {
                if (error) console.error("Error fetching order:", error);
                return { success: false, message: "Orden no encontrada." };
            }

            // Procesamos los datos como en tu función getOrderDetails
            const orderInfo = data[0];
            let schoolName: string | undefined = undefined;

            if (orderInfo.school_id) {
                const { data: schoolData } = await supabase
                    .from('schools')
                    .select('name')
                    .eq('id', orderInfo.school_id)
                    .single();
                schoolName = schoolData?.name;
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
                items: data.map(row => ({
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

        } catch (e: any) {
            console.error('Error en la búsqueda de orden:', e.message);
            return { success: false, message: "Error al conectar con la base de datos." };
        }
    }
    // Si no, asumimos que es un código de barras y buscamos el producto.
    else {
        try {
            const { data, error } = await supabase
                .from('full_inventory_details')
                .select('*')
                .eq('barcode', term)
                .single();

            if (error) {
                // Producto no encontrado
                if (error.code === 'PGRST116') {
                    return { success: false, message: "Producto no encontrado." };
                }
                throw error;
            }

            return { success: true, type: 'product', data: data as ProductDetails };
        } catch (e: any) {
            console.error('Error en la búsqueda por código de barras:', e.message);
            return { success: false, message: "Error al conectar con la base de datos." };
        }
    }
}