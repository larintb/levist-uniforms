// app/admin/products/page.tsx
import { ProductsList } from '@/components/admin/ProductsList';

/**
 * El tipo de dato "ideal" y aplanado que usaremos en todo el componente cliente.
 * La transformación de los datos de Supabase a esta estructura se hará en el componente cliente.
 */
export type ProductWithDetails = {
    id: string;
    name: string;
    sku_base: string;
    // Hacemos que la información anidada sea de primer nivel para un acceso más fácil
    brand_name: string | null;
    collection_name: string | null; 
};

// La página sigue siendo un contenedor simple para el layout y el componente cliente.
export default function ProductsPage() {
    return (
        <div className="p-4 md:p-8">
            <header className="mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900">Productos</h1>
                    <p className="text-lg text-gray-600">Gestiona el catálogo de productos de tu tienda.</p>
                </div>
            </header>
            
            {/* El componente de cliente sigue manejando toda la lógica. */}
            <ProductsList />
        </div>
    );
}