import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/ProductForm";
import type { ProductFormProps } from "@/components/admin/ProductForm";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  if (!id) notFound();

  const [
    { data: product, error: productError },
    { data: brands, error: brandsError },
    { data: collections, error: collectionsError },
    { data: categories, error: categoriesError },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("*, product_variants(*, inventory(*))")
      .eq("id", id)
      .single(),
    supabase.from("brands").select("id, name"),
    supabase.from("collections").select("id, name, brand_id"),
    supabase.from("categories").select("id, name"),
  ]);

  if (productError) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          Error al cargar el producto. Revisa la conexión y vuelve a intentarlo.
        </p>
      </div>
    );
  }

  if (!product) notFound();

  const auxiliaryErrors = [brandsError, collectionsError, categoriesError].filter(Boolean);

  return (
    <div className="p-6 max-w-4xl">
      <PageHeader
        title="Editar Producto"
        description={`Modifica los detalles de ${product.name}`}
      />

      {auxiliaryErrors.length > 0 && (
        <div className="mb-5 text-sm text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          Algunos datos (marcas, colecciones o categorías) no pudieron cargarse.{" "}
          <a href="" className="font-semibold underline underline-offset-2">Recargar</a> para intentar de nuevo.
        </div>
      )}

      <ErrorBoundary>
        <ProductForm
          brands={brands || []}
          collections={collections || []}
          categories={categories || []}
          initialData={product as ProductFormProps["initialData"]}
        />
      </ErrorBoundary>
    </div>
  );
}
