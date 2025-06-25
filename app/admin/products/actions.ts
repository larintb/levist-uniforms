"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// --- Tipos de Datos (sin cambios) ---
type InventoryData = {
    size: string;
    stock: number;
    price: number;
    barcode: string | null;
};

type VariantData = {
    color: string;
    image_url: string | null;
    inventory: InventoryData[];
};

// --- ACCIÓN PARA CREAR PRODUCTOS (sin cambios) ---
export async function createProductAction(formData: FormData) {
  // La lógica de creación ya es correcta y no necesita cambios.
  const supabase = await createClient();
  const rawData = {
    name: formData.get('name') as string,
    sku_base: formData.get('sku_base') as string,
    collection_id: formData.get('collection_id') as string,
    category_id: formData.get('category_id') as string,
    variants: JSON.parse(formData.get('variants_json') as string) as VariantData[],
  };
  try {
    const { data: productData, error: productError } = await supabase.from('products').insert({ name: rawData.name, sku_base: rawData.sku_base, collection_id: rawData.collection_id, category_id: rawData.category_id }).select('id').single();
    if (productError) throw productError;
    const newProductId = productData.id;
    for (const variant of rawData.variants) {
      const { data: variantData, error: variantError } = await supabase.from('product_variants').insert({ product_id: newProductId, color: variant.color, image_url: variant.image_url || null }).select('id').single();
      if (variantError) throw variantError;
      const newVariantId = variantData.id;
      if (variant.inventory.length > 0) {
        const inventoryToInsert = variant.inventory.map(inv => ({ variant_id: newVariantId, size: inv.size, stock: inv.stock, price: inv.price, barcode: inv.barcode || null }));
        const { error: inventoryError } = await supabase.from('inventory').insert(inventoryToInsert);
        if (inventoryError) throw inventoryError;
      }
    }
  } catch (error: any) {
    return { success: false, message: error.message };
  }
  revalidatePath('/admin/dashboard');
  revalidatePath('/admin/products');
  return { success: true, message: "Producto creado con éxito" };
}


// --- ¡ACCIÓN PARA ACTUALIZAR PRODUCTOS REFACTORIZADA! ---
// Se reemplaza la lógica "delete-recreate" por "upsert" para no borrar datos históricos.
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
        // 1. Actualizar los datos del producto principal. Esto es seguro.
        const { error: productUpdateError } = await supabase
            .from('products')
            .update({
                name: rawData.name,
                sku_base: rawData.sku_base,
                collection_id: rawData.collection_id,
                category_id: rawData.category_id,
            })
            .eq('id', productId);
        if (productUpdateError) throw productUpdateError;

        // 2. Procesar las variantes y el inventario con "upsert".
        for (const variant of rawData.variants) {
            // Preparamos el objeto para la variante. La clave única es (product_id, color).
            const variantObject = {
                product_id: productId,
                color: variant.color,
                image_url: variant.image_url || null,
            };

            // Hacemos upsert en product_variants. Si existe una variante con el mismo
            // product_id y color, la actualiza. Si no, la crea.
            const { data: upsertedVariant, error: variantError } = await supabase
                .from('product_variants')
                .upsert(variantObject, { onConflict: 'product_id, color' })
                .select('id')
                .single();
            
            if (variantError) throw variantError;
            if (!upsertedVariant) throw new Error("No se pudo crear o actualizar la variante.");
            
            const variantId = upsertedVariant.id;
            
            // Preparamos los objetos de inventario para esta variante.
            if (variant.inventory.length > 0) {
                const inventoryToUpsert = variant.inventory.map(inv => ({
                    variant_id: variantId,
                    size: inv.size,
                    stock: inv.stock,
                    price: inv.price,
                    barcode: inv.barcode || null,
                }));
                
                // Hacemos upsert en inventory. La clave única es (variant_id, size).
                const { error: inventoryError } = await supabase
                    .from('inventory')
                    .upsert(inventoryToUpsert, { onConflict: 'variant_id, size' });
                    
                if (inventoryError) throw inventoryError;
            }
        }
        
        // NOTA: Esta lógica no maneja la eliminación de variantes o tallas que el usuario
        // haya quitado del formulario. Se necesitaría una lógica de comparación más compleja
        // para manejar esos casos de forma segura, que podemos implementar más adelante.
        // El objetivo principal (arreglar el error de actualización) está resuelto.

    } catch (error: any) {
        console.error("Error actualizando producto:", error);
        return { success: false, message: `Error al actualizar: ${error.message}` };
    }

    // Revalidar todas las rutas afectadas para mostrar los datos actualizados.
    revalidatePath('/admin/products');
    revalidatePath('/admin/dashboard');
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
        // Este error también podría ocurrir si el producto tiene órdenes.
        return { success: false, message: `Error al eliminar el producto: ${error.message}` };
    }

    revalidatePath('/admin/products');
    revalidatePath('/admin/dashboard');

    return { success: true, message: "Producto eliminado con éxito." };
}
