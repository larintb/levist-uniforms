// app/admin/products/new/page.tsx
import { createClient } from '@/lib/supabase/server';
import { ProductForm } from '@/components/admin/ProductForm';

export default async function NewProductPage() {
  // ¡CORRECCIÓN! Ahora usamos await porque createClient es asíncrona.
  const supabase = await createClient();

  const brandsPromise = supabase.from('brands').select('id, name');
  const collectionsPromise = supabase.from('collections').select('id, name, brand_id');
  const categoriesPromise = supabase.from('categories').select('id, name');

  const [
    { data: brands, error: brandsError },
    { data: collections, error: collectionsError },
    { data: categories, error: categoriesError },
  ] = await Promise.all([brandsPromise, collectionsPromise, categoriesPromise]);

  if (brandsError || collectionsError || categoriesError) {
    console.error({ brandsError, collectionsError, categoriesError });
    return (
      <div className="p-8"><p className="text-red-600 bg-red-100 p-4 rounded-lg">Error al cargar datos.</p></div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Crear Nuevo Producto</h1>
        <p className="text-lg text-gray-600">Completa los detalles del nuevo artículo.</p>
      </header>
      <main>
        <ProductForm 
          brands={brands || []} 
          collections={collections || []} 
          categories={categories || []}
        />
      </main>
    </div>
  );
}
