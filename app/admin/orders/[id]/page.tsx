// app/admin/orders/[id]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { Receipt } from "@/components/admin/Receipt";
import { notFound } from "next/navigation";

// Forzamos el renderizado dinámico para asegurar datos frescos
export const dynamic = "force-dynamic";

type PageProps = {
    params: Promise<{ id: string }>; // Ahora params es una Promise
};

// Función para obtener los detalles de la orden desde la base de datos
async function getOrderDetails(orderId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('full_order_details')
        .select('*')
        .eq('order_id', orderId);

    if (error) {
        console.error("Error fetching order details:", error);
        return null;
    }

    if (!data || data.length === 0) {
        return null;
    }

    // Agrupamos los resultados para formar un solo objeto de orden con sus ítems
    const orderDetails = {
        order_id: data[0].order_id,
        order_date: data[0].order_date,
        order_total: data[0].order_total,
        payment_method: data[0].payment_method,
        seller_name: data[0].seller_name,
        customer_name: data[0].customer_name,
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

    return orderDetails;
}

export default async function OrderDetailPage({ params }: PageProps) {
    // Esperamos la resolución de params antes de acceder a sus propiedades
    const { id } = await params;
    
    const orderDetails = await getOrderDetails(id);

    if (!orderDetails) {
        notFound(); // Muestra la página 404 si la orden no existe
    }

    return (
        <div>
            <header className="bg-white shadow-sm print:hidden">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
                    <h1 className="text-2xl font-bold leading-6 text-gray-900">
                        Detalle de Orden
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Mostrando ticket para la orden <span className="font-mono bg-gray-200 p-1 rounded">{id.slice(0, 8)}</span>
                    </p>
                </div>
            </header>
            <main>
                <Receipt details={orderDetails} />
            </main>
        </div>
    );
}