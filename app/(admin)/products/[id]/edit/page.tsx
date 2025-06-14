// app/(admin)/products/[id]/edit/page.tsx

import { createClient } from '@/lib/supabase/server';
import { ProductForm } from '@/components/admin/ProductForm';
import type { ProductFormProps } from '@/components/admin/ProductForm';

export const dynamic = 'force-dynamic'; // 🔥 Esta línea resuelve el error con `params`

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  if (!params.id || typeof params.id !== 'string') {
    return (
      <div className="p-8">
        <p className="text-red-600 bg-red-100 p-4 rounded-lg">
          Error: ID de producto inválido.
        </p>
      </div>
    );
  }

  const productPromise = supabase
    .from('products')
    .select(`
      *,
      product_variants (
        *,
        inventory ( * )
      )
    `)
    .eq('id', params.id)
    .single();

  const brandsPromise = supabase.from('brands').select('id, name');
  const collectionsPromise = supabase.from('collections').select('id, name, brand_id');
  const categoriesPromise = supabase.from('categories').select('id, name');

  const [
    { data: product, error: productError },
    { data: brands, error: brandsError },
    { data: collections, error: collectionsError },
    { data: categories, error: categoriesError },
  ] = await Promise.all([
    productPromise,
    brandsPromise,
    collectionsPromise,
    categoriesPromise,
  ]);

  if (productError || brandsError || collectionsError || categoriesError || !product) {
    console.error({ productError, brandsError, collectionsError, categoriesError });
    return (
      <div className="p-8">
        <p className="text-red-600 bg-red-100 p-4 rounded-lg">
          Error al cargar datos. El producto podría no existir.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Editar Producto</h1>
        <p className="text-lg text-gray-600">
          Modifica los detalles del producto <span className="font-semibold">{product.name}</span>.
        </p>
      </header>

      <main>
        <ProductForm 
          brands={brands || []} 
          collections={collections || []} 
          categories={categories || []}
          initialData={product as ProductFormProps['initialData']}
        />
      </main>
    </div>
  );
}
