"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { type NextRequest } from 'next/server'

// ¡ACTUALIZADO! El tipo de los datos de inventario ahora incluye el barcode.
type InventoryData = {
    size: string;
    stock: number;
    price: number;
    barcode: string | null; // Se añade el barcode
};

type VariantData = {
    color: string;
    image_url: string | null;
    inventory: InventoryData[];
};

// --- ACCIÓN PARA CREAR PRODUCTOS (Actualizada para manejar barcodes) ---
export async function createProductAction(formData: FormData) {
  const supabase = await createClient();
  
  const rawData = {
    name: formData.get('name') as string,
    sku_base: formData.get('sku_base') as string,
    collection_id: formData.get('collection_id') as string,
    category_id: formData.get('category_id') as string,
    variants: JSON.parse(formData.get('variants_json') as string) as VariantData[],
  };

  try {
    // 1. Crear el producto principal
    const { data: productData, error: productError } = await supabase
      .from('products')
      .insert({
        name: rawData.name,
        sku_base: rawData.sku_base,
        collection_id: rawData.collection_id,
        category_id: rawData.category_id,
      })
      .select('id')
      .single();

    if (productError) throw productError;
    const newProductId = productData.id;

    // 2. Iterar sobre las variantes y su inventario
    for (const variant of rawData.variants) {
      const { data: variantData, error: variantError } = await supabase
        .from('product_variants')
        .insert({
          product_id: newProductId,
          color: variant.color,
          image_url: variant.image_url || null,
        })
        .select('id')
        .single();
      
      if (variantError) throw variantError;
      const newVariantId = variantData.id;

      if (variant.inventory.length > 0) {
        // ¡ACTUALIZADO! El objeto a insertar ahora incluye el barcode.
        // Se filtran los barcodes vacíos o nulos para guardarlos como NULL en la BD.
        const inventoryToInsert = variant.inventory.map(inv => ({
          variant_id: newVariantId,
          size: inv.size,
          stock: inv.stock,
          price: inv.price,
          barcode: inv.barcode || null, // Guardar null si el barcode está vacío
        }));

        const { error: inventoryError } = await supabase.from('inventory').insert(inventoryToInsert);
        if (inventoryError) throw inventoryError;
      }
    }
  } catch (error: any) {
    console.error("Error creando producto:", error);
    return { success: false, message: error.message };
  }

  // Revalidar rutas para refrescar la UI
  revalidatePath('/admin/products');
  revalidatePath('/admin/dashboard');

  return { success: true, message: "Producto creado con éxito" };
}


// --- ACCIÓN PARA ACTUALIZAR PRODUCTOS (Actualizada para manejar barcodes) ---
// Nota: Esta acción sigue un patrón de "borrar y recrear" las variantes.
// Para un sistema a gran escala, se podría refactorizar a un "upsert" para mayor eficiencia.
export async function updateProductAction(productId: string, formData: FormData) {
    const supabase = await createClient();
    
    const rawData = {
        name: formData.get('name') as string,
        sku_base: formData.get('sku_base') as string,
        collection_id: formData.get('collection_id') as string,
        category_id: formData.get('category_id') as string,
        variants: JSON.parse(formData.get('variants_json') as string) as VariantData[],
    };

    try {
        // La transacción asegura que todas las operaciones se completen o ninguna lo haga.
        // Nota: Las transacciones en Supabase Edge Functions se manejan con funciones plpgsql.
        // Aquí simulamos una secuencia atómica. Un error en cualquier punto detendrá el proceso.

        // 1. Borrar las variantes antiguas (y su inventario en cascada)
        // ADVERTENCIA: Esta es una operación destructiva.
        const { error: deleteError } = await supabase.from('product_variants').delete().eq('product_id', productId);
        if (deleteError) throw new Error(`Error limpiando variantes antiguas: ${deleteError.message}`);

        // 2. Actualizar la información del producto principal
        const { error: updateError } = await supabase
          .from('products')
          .update({
            name: rawData.name,
            sku_base: rawData.sku_base,
            collection_id: rawData.collection_id,
            category_id: rawData.category_id,
          })
          .eq('id', productId);

        if (updateError) throw updateError;
        
        // 3. Re-crear las variantes y su inventario desde cero (con barcodes)
        for (const variant of rawData.variants) {
            const { data: variantData, error: variantError } = await supabase
              .from('product_variants')
              .insert({
                product_id: productId,
                color: variant.color,
                image_url: variant.image_url || null
              })
              .select('id')
              .single();

            if (variantError) throw variantError;
            const newVariantId = variantData.id;

            if (variant.inventory.length > 0) {
                 // ¡ACTUALIZADO! El objeto a insertar ahora incluye el barcode.
                const inventoryToInsert = variant.inventory.map(inv => ({
                    variant_id: newVariantId,
                    size: inv.size,
                    stock: inv.stock,
                    price: inv.price,
                    barcode: inv.barcode || null,
                }));

                const { error: inventoryError } = await supabase.from('inventory').insert(inventoryToInsert);
                if (inventoryError) throw inventoryError;
            }
        }
    } catch (error: any) {
        console.error("Error actualizando producto:", error);
        return { success: false, message: error.message };
    }

    // Revalidar todas las rutas afectadas para mostrar los datos actualizados
    revalidatePath('/admin/products');
    revalidatePath('/admin/dashboard');
    revalidatePath(`/products`); // Para la tienda pública
    revalidatePath(`/admin/products/${productId}/edit`);

    return { success: true, message: "Producto actualizado con éxito" };
}

// --- ACCIÓN PARA ELIMINAR PRODUCTOS (sin cambios) ---
export async function deleteProductAction(productId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

    if (error) {
        return { success: false, message: `Error al eliminar el producto: ${error.message}` };
    }

    revalidatePath('/admin/products');
    revalidatePath('/admin/dashboard');

    return { success: true, message: "Producto eliminado con éxito." };
}
