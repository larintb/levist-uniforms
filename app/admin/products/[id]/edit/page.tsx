import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/ProductForm";
import type { ProductFormProps } from "@/components/admin/ProductForm";
import { notFound } from "next/navigation";

/**
 * Forzamos el renderizado dinámico de la página en cada solicitud.
 * Esto asegura que siempre obtengamos los datos más recientes.
 */
export const dynamic = "force-dynamic";

/**
 * Página para editar un producto existente.
 *
 * Actualización para Next.js 15:
 * En Next.js 15, `params` es una Promise que debe ser esperada antes de
 * acceder a sus propiedades. Esto es parte del nuevo modelo de APIs dinámicas.
 */
export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>; // Ahora params es una Promise
}) {
  // Esperamos la resolución de params antes de desestructurar
  const { id } = await params;
  const supabase = await createClient();

  // Verificación temprana y semántica del ID.
  // Si no hay un ID válido, mostramos la página 404 de Next.js.
  if (!id) {
    notFound();
  }

  // Definimos todas las consultas a la base de datos de forma concurrente.
  const productPromise = supabase
    .from("products")
    .select(
      `
      *,
      product_variants (
        *,
        inventory ( * )
      )
    `
    )
    .eq("id", id) // Usamos la constante `id` que ya está resuelta.
    .single();

  const brandsPromise = supabase.from("brands").select("id, name");
  const collectionsPromise = supabase
    .from("collections")
    .select("id, name, brand_id");
  const categoriesPromise = supabase.from("categories").select("id, name");

  // Ejecutamos todas las promesas en paralelo para mayor eficiencia.
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

  // Manejo de errores centralizado.
  if (productError || brandsError || collectionsError || categoriesError) {
    console.error("Error al cargar datos desde Supabase:", {
      productError,
      brandsError,
      collectionsError,
      categoriesError,
    });
    // Mostramos un error genérico si falla alguna consulta.
    return (
      <div className="p-8">
        <p className="rounded-lg bg-red-100 p-4 text-red-600">
          Error al cargar los datos necesarios. Por favor, revisa la conexión y
          vuelve a intentarlo.
        </p>
      </div>
    );
  }

  // Si las consultas fueron exitosas pero el producto específico no se encontró,
  // mostramos la página 404.
  if (!product) {
    notFound();
  }

  // Si todo es exitoso, renderizamos la página con el formulario.
  return (
    <div className="p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Editar Producto</h1>
        <p className="text-lg text-gray-600">
          Modifica los detalles del producto{" "}
          <span className="font-semibold">{product.name}</span>.
        </p>
      </header>

      <main>
        <ProductForm
          brands={brands || []}
          collections={collections || []}
          categories={categories || []}
          initialData={product as ProductFormProps["initialData"]}
        />
      </main>
    </div>
  );
}