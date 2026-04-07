import { createClient } from "@/lib/supabase/server";
import { EncargoTicket } from "@/components/admin/EncargoTicket";
import { notFound } from "next/navigation";
import { Encargo } from "@/app/admin/encargos/actions";

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

export default async function EncargoTicketPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("full_encargo_details_view")
        .select("*")
        .eq("encargo_id", id);

    if (error || !data || data.length === 0) {
        notFound();
    }

    const rows = data as EncargoViewRow[];
    const first = rows[0];

    const encargo: Encargo = {
        id: first.encargo_id,
        created_at: first.encargo_date,
        customer_name: first.customer_name,
        customer_phone: first.customer_phone,
        embroidery_notes: first.embroidery_notes,
        deposit: first.deposit,
        status: first.encargo_status as "PENDING" | "FULFILLED" | "CANCELLED",
        fulfilled_at: first.fulfilled_at,
        fulfilled_order_id: first.fulfilled_order_id,
        notes: first.notes,
        seller_name: first.seller_name,
        school_name: first.school_name,
        items: rows.map((row) => ({
            inventory_id: row.inventory_id,
            quantity: row.quantity,
            price: row.price_per_unit,
            product_name: row.product_name,
            sku: row.sku,
            color: row.color,
            size: row.size,
            current_stock: row.current_stock,
        })),
    };

    return <EncargoTicket encargo={encargo} />;
}
