// app/admin/catalog/page.tsx
import { createClient } from '@/lib/supabase/server';
import { CatalogManager } from '@/components/admin/CatalogManager';
import { PageHeader } from '@/components/admin/PageHeader';

export default async function CatalogPage() {
    const supabase = await createClient();

    // Obtenemos todos los datos necesarios en paralelo
    const brandsPromise = supabase.from('brands').select('*').order('name');
    const collectionsPromise = supabase.from('collections').select('*, brands(name)').order('name');
    const categoriesPromise = supabase.from('categories').select('*').order('name'); // Añadido

    const [
        { data: brands, error: brandsError },
        { data: collections, error: collectionsError },
        { data: categories, error: categoriesError } // Añadido
    ] = await Promise.all([brandsPromise, collectionsPromise, categoriesPromise]);

    if (brandsError || collectionsError || categoriesError) { // Añadido
        console.error({ brandsError, collectionsError, categoriesError });
        return <p className="p-8 text-red-500">Error al cargar datos del catálogo.</p>;
    }

    return (
        <div className="p-6">
            <PageHeader title="Catálogo" description="Gestiona las marcas, colecciones y categorías de tu tienda." />
            <CatalogManager
                initialBrands={brands || []}
                initialCollections={collections || []}
                initialCategories={categories || []}
            />
        </div>
    );
}
