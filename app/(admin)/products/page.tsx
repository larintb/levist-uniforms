// app/(admin)/products/page.tsx
import { createClient } from '@/lib/supabase/server';
import { ProductsList } from '@/components/admin/ProductsList';
import Link from 'next/link';

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
);

// CORRECCIÓN: El tipo se actualiza para reflejar la estructura de la consulta anidada.
export type ProductWithDetails = {
    id: string;
    name: string;
    sku_base: string;
    collections: {
        name: string | null;
        brands: {
            name: string | null;
        } | null;
    } | null;
};

export default async function ProductsPage() {
    const supabase = await createClient();

    // CORRECCIÓN: La consulta ahora anida la petición de `brands` dentro de `collections`
    // para seguir correctamente la relación de la base de datos.
    const { data: products, error } = await supabase
        .from('products')
        .select(`
            id,
            name,
            sku_base,
            collections (
                name,
                brands ( name )
            )
        `)
        .order('name', { ascending: true });

    if (error) {
        console.error("Error fetching products:", error);
        return <p className="p-8 text-red-500">Error al cargar la lista de productos.</p>;
    }

    return (
        <div className="p-4 md:p-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900">Productos</h1>
                    <p className="text-lg text-gray-600">Gestiona el catálogo de productos de tu tienda.</p>
                </div>
                <Link href="/products/new" className="flex items-center justify-center bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-300 shadow">
                    <PlusIcon />
                    Crear Producto
                </Link>
            </header>

            <main>
                <ProductsList products={products as unknown as ProductWithDetails[] || []} />
            </main>
        </div>
    );
}
