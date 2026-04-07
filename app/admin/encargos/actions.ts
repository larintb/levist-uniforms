"use server";

import { createClient } from "@/lib/supabase/server";
import { updateOrderMultipleStatuses } from "@/app/admin/orders/multiple-status-actions";
import { revalidatePath } from "next/cache";
import { GroupedProduct } from "@/app/admin/pos/actions";

// --- Types ---

export type EncargoItem = {
    inventory_id: string;
    quantity: number;
    price: number;
    product_name: string;
    sku: string;
    color: string;
    size: string;
    current_stock: number;
};

export type Encargo = {
    id: string;
    created_at: string;
    customer_name: string;
    customer_phone: string | null;
    embroidery_notes: string | null;
    deposit: number;
    status: "PENDING" | "FULFILLED" | "CANCELLED";
    fulfilled_at: string | null;
    fulfilled_order_id: string | null;
    notes: string | null;
    seller_name: string | null;
    school_name: string | null;
    items: EncargoItem[];
};

type EncargoViewRow = {
    encargo_id: string;
    encargo_date: string;
    customer_name: string;
    customer_phone: string | null;
    embroidery_notes: string | null;
    deposit: number;
    encargo_status: string;
    fulfilled_at: string | null;
    fulfilled_order_id: string | null;
    notes: string | null;
    seller_name: string | null;
    school_name: string | null;
    item_id: string;
    inventory_id: string;
    quantity: number;
    price_per_unit: number;
    product_name: string;
    sku: string;
    color: string;
    size: string;
    current_stock: number;
};

export type CreateEncargoPayload = {
    customerName: string;
    customerPhone: string;
    schoolId: string | null;
    embroideryNotes: string;
    notes: string;
    deposit: number;
    items: { inventory_id: string; quantity: number; price: number }[];
};

export type FulfillEncargoPayload = {
    encargoId: string;
    paymentMethod: string;
    total: number;
    subtotal: number;
    discountAmount: number;
    discountReason: string;
    isLayaway: boolean;
    downPayment: number;
    remainingBalance: number;
};

// --- Actions ---

export async function getSchools(): Promise<{ id: string; name: string }[]> {
    const supabase = await createClient();
    const { data, error } = await supabase.from("schools").select("id, name").order("name");
    if (error) return [];
    return data;
}

/**
 * Búsqueda server-side en full_inventory_details.
 * Busca por nombre de producto o SKU (ilike, sin distinción de mayúsculas).
 */
export async function searchProductsForEncargo(query: string): Promise<GroupedProduct[]> {
    if (!query || query.trim().length < 1) return [];

    const supabase = await createClient();
    const term = `%${query.trim()}%`;

    const { data, error } = await supabase
        .from("full_inventory_details")
        .select("inventory_id, product_name, sku, color, size, stock, price, barcode, product_image")
        .or(`product_name.ilike.${term},sku.ilike.${term}`)
        .order("product_name", { ascending: true })
        .order("size", { ascending: true });

    if (error) {
        console.error("Error searching products for encargo:", error);
        return [];
    }

    const productMap = new Map<string, GroupedProduct>();

    for (const item of data) {
        const sku = item.sku;

        if (!productMap.has(sku)) {
            productMap.set(sku, {
                sku_base: sku,
                product_name: item.product_name,
                colors: [],
            });
        }

        const groupedProduct = productMap.get(sku)!;
        let colorVariant = groupedProduct.colors.find((c) => c.color === item.color);

        if (!colorVariant) {
            colorVariant = {
                color: item.color,
                product_image: item.product_image,
                variants: [],
            };
            groupedProduct.colors.push(colorVariant);
        }

        colorVariant.variants.push({
            inventory_id: item.inventory_id,
            size: item.size,
            stock: item.stock,
            price: item.price,
            barcode: item.barcode,
        });
    }

    return Array.from(productMap.values());
}

export async function createEncargoAction(
    payload: CreateEncargoPayload
): Promise<{ success: boolean; encargoId?: string; message?: string }> {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("create_encargo", {
        p_customer_name: payload.customerName,
        p_customer_phone: payload.customerPhone || null,
        p_school_id: payload.schoolId || null,
        p_embroidery_notes: payload.embroideryNotes || null,
        p_notes: payload.notes || null,
        p_deposit: payload.deposit,
        p_items: payload.items,
    });

    if (error) {
        console.error("Error creating encargo:", error);
        return { success: false, message: error.message };
    }

    revalidatePath("/admin/encargos");
    return { success: true, encargoId: data as string };
}

export async function getEncargos(
    statusFilter?: string
): Promise<Encargo[]> {
    const supabase = await createClient();

    let query = supabase
        .from("full_encargo_details_view")
        .select("*")
        .order("encargo_date", { ascending: false });

    if (statusFilter && statusFilter !== "ALL") {
        query = query.eq("encargo_status", statusFilter);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching encargos:", error);
        return [];
    }

    const encargoMap = new Map<string, Encargo>();

    for (const row of data as EncargoViewRow[]) {
        if (!encargoMap.has(row.encargo_id)) {
            encargoMap.set(row.encargo_id, {
                id: row.encargo_id,
                created_at: row.encargo_date,
                customer_name: row.customer_name,
                customer_phone: row.customer_phone,
                embroidery_notes: row.embroidery_notes,
                deposit: row.deposit,
                status: row.encargo_status as "PENDING" | "FULFILLED" | "CANCELLED",
                fulfilled_at: row.fulfilled_at,
                fulfilled_order_id: row.fulfilled_order_id,
                notes: row.notes,
                seller_name: row.seller_name,
                school_name: row.school_name,
                items: [],
            });
        }

        encargoMap.get(row.encargo_id)!.items.push({
            inventory_id: row.inventory_id,
            quantity: row.quantity,
            price: row.price_per_unit,
            product_name: row.product_name,
            sku: row.sku,
            color: row.color,
            size: row.size,
            current_stock: row.current_stock,
        });
    }

    return Array.from(encargoMap.values());
}

export async function fulfillEncargoAction(
    payload: FulfillEncargoPayload
): Promise<{ success: boolean; orderId?: string; message?: string }> {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("fulfill_encargo", {
        p_encargo_id: payload.encargoId,
        p_payment_method: payload.paymentMethod,
        p_total: payload.total,
        p_subtotal: payload.subtotal,
        p_discount_amount: payload.discountAmount,
        p_discount_reason: payload.discountReason || null,
        p_is_layaway: payload.isLayaway,
        p_down_payment: payload.downPayment,
        p_remaining_balance: payload.remainingBalance,
    });

    if (error) {
        console.error("Error fulfilling encargo:", error);
        return { success: false, message: error.message };
    }

    const orderId = data as string;

    // Agregar status COMPLETED a order_statuses (tabla de estados múltiples)
    await updateOrderMultipleStatuses(orderId, ["COMPLETED"], "encargo");

    revalidatePath("/admin/encargos");
    revalidatePath("/admin/orders");
    return { success: true, orderId };
}

export async function cancelEncargoAction(
    encargoId: string
): Promise<{ success: boolean; message?: string }> {
    const supabase = await createClient();

    const { error } = await supabase
        .from("encargos")
        .update({ status: "CANCELLED" })
        .eq("id", encargoId)
        .eq("status", "PENDING");

    if (error) {
        console.error("Error cancelling encargo:", error);
        return { success: false, message: error.message };
    }

    revalidatePath("/admin/encargos");
    return { success: true };
}
