import { createClient } from '@/lib/supabase/server';
import { ProductForm } from '@/components/admin/ProductForm';
import { PageHeader } from '@/components/admin/PageHeader';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default async function NewProductPage() {
  const supabase = await createClient();

  const [
    { data: brands, error: brandsError },
    { data: collections, error: collectionsError },
    { data: categories, error: categoriesError },
  ] = await Promise.all([
    supabase.from('brands').select('id, name'),
    supabase.from('collections').select('id, name, brand_id'),
    supabase.from('categories').select('id, name'),
  ]);

  if (brandsError || collectionsError || categoriesError) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          Error al cargar datos. Recarga la página.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <PageHeader title="Crear Producto" description="Define los datos base, variantes de color e inventario del nuevo artículo." />
      <ErrorBoundary>
        <ProductForm
          brands={brands || []}
          collections={collections || []}
          categories={categories || []}
        />
      </ErrorBoundary>
    </div>
  );
}
