// Pega este código completo en tu archivo actions.ts

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { randomUUID } from 'crypto';

// --- Tipos de Datos ---
type InventoryData = {
    id?: string;
    size: string;
    stock: number;
    price: number;
    barcode: string | null;
};

type VariantData = {
    id?: string;
    color: string;
    image_url: string | null;
    inventory: InventoryData[];
};

// --- ACCIÓN PARA CREAR PRODUCTOS ---
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
  } catch (error) {
    console.error("Error creando producto:", error);
    return { success: false, message: `Error al crear: ${error instanceof Error ? error.message : String(error)}` };
  }

  revalidatePath('/admin/products');
  return { success: true, message: "Producto creado con éxito" };
}


// --- ¡ACCIÓN PARA ACTUALIZAR PRODUCTOS CORREGIDA! ---
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
        // 1. Actualizar los datos del producto principal
        const { error: productUpdateError } = await supabase
            .from('products')
            .update({
                name: rawData.name,
                sku_base: rawData.sku_base,
                collection_id: rawData.collection_id,
                category_id: rawData.category_id,
            })
            .eq('id', productId);
        // Si hay un error en la actualización, retornamos un fracaso con el mensaje.
        if (productUpdateError) {
          console.error("Error al actualizar el producto:", productUpdateError);
          return {
            success: false,
            message: `Error al actualizar el producto: ${productUpdateError.message}`,
          };
        }

        // 2. Obtener los IDs de las variantes existentes en la BD
        const { data: existingVariants, error: fetchError } = await supabase
            .from('product_variants')
            .select('id')
            .eq('product_id', productId);
        
        if (fetchError) throw fetchError;
        const existingVariantIds = new Set(existingVariants.map(v => v.id));

        // 3. Procesar variantes y su inventario desde el formulario
        const incomingVariantIds = new Set<string>();

        for (const variant of rawData.variants) {
            const variantObject = {
                id: variant.id,
                product_id: productId,
                color: variant.color,
                image_url: variant.image_url || null,
            };

            const { data: upsertedVariant, error: variantError } = await supabase
                .from('product_variants')
                .upsert(variantObject)
                .select('id')
                .single();

            if (variantError) throw variantError;
            if (!upsertedVariant) throw new Error("No se pudo crear o actualizar la variante.");
            
            const variantId = upsertedVariant.id;
            incomingVariantIds.add(variantId);

            // Sincronizar inventario para esta variante
            if (variant.inventory) {
                const {data: existingInventory, error: fetchInvError} = await supabase
                    .from('inventory')
                    .select('id')
                    .eq('variant_id', variantId);
                if(fetchInvError) throw fetchInvError;
                const existingInventoryIds = new Set(existingInventory.map(i => i.id));
                const incomingInventoryIds = new Set<string>();

                if (variant.inventory.length > 0) {
                    const inventoryToUpsert = variant.inventory.map(inv => ({
                        id: inv.id || randomUUID(), 
                        variant_id: variantId,
                        size: inv.size,
                        stock: inv.stock,
                        price: inv.price,
                        barcode: inv.barcode || null,
                    }));
    
                    const { data: upsertedInventory, error: inventoryError } = await supabase
                        .from('inventory')
                        .upsert(inventoryToUpsert)
                        .select('id');
                        
                    // Si hay un error, registrarlo y retornar un fracaso.
                    if (inventoryError) {
                      console.error("Error al procesar el inventario:", inventoryError);
                      return {
                        success: false,
                        message: `Error al procesar el inventario: ${inventoryError.message}`,
                      };
                    }
                    // Agregar los IDs del inventario actualizado o insertado a la lista de IDs válidos.
                    if (upsertedInventory) {
                      upsertedInventory.forEach(inv => incomingInventoryIds.add(inv.id));
                    }
                }

                const inventoryIdsToDelete = [...existingInventoryIds].filter(id => !incomingInventoryIds.has(id));
                if(inventoryIdsToDelete.length > 0){
                    await supabase.from('inventory').delete().in('id', inventoryIdsToDelete);
                }
            }
        }

        // 4. Determinar y eliminar variantes huérfanas
        const variantIdsToDelete = [...existingVariantIds].filter(
            id => !incomingVariantIds.has(id)
        );

        if (variantIdsToDelete.length > 0) {
            // Si hay un error, registrarlo y retornar un fracaso.
            const { error: deleteError } = await supabase.from('product_variants').delete().in('id', variantIdsToDelete);
            if (deleteError) {
              console.error("Error al eliminar variantes obsoletas:", deleteError);
              return {
                success: false,
                message: `Error al eliminar variantes: ${deleteError.message}`,
              };
            }
        }
        
    } catch (error) {
        console.error("Error actualizando producto:", error);
        return { success: false, message: `Error al actualizar: ${error instanceof Error ? error.message : String(error)}` };
    }

    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/${productId}/edit`);
    return { success: true, message: "Producto actualizado con éxito" };
}

// --- ACCIÓN PARA ELIMINAR PRODUCTOS ---
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
    return { success: true, message: "Producto eliminado con éxito." };
}