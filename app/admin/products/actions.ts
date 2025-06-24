// app/admin/products/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type VariantData = { color: string; image_url: string | null; inventory: { size: string; stock: number; price: number; }[]; };

// --- ACCIÓN PARA CREAR PRODUCTOS (sin cambios) ---
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
        const inventoryToInsert = variant.inventory.map(inv => ({ variant_id: newVariantId, size: inv.size, stock: inv.stock, price: inv.price }));
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


// --- ACCIÓN PARA ACTUALIZAR PRODUCTOS (sin cambios) ---
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
        const { error: deleteError } = await supabase.from('product_variants').delete().eq('product_id', productId);
        if (deleteError) throw new Error(`Error limpiando variantes: ${deleteError.message}`);
        const { error: updateError } = await supabase.from('products').update({ name: rawData.name, sku_base: rawData.sku_base, collection_id: rawData.collection_id, category_id: rawData.category_id }).eq('id', productId);
        if (updateError) throw updateError;
        for (const variant of rawData.variants) {
            const { data: variantData, error: variantError } = await supabase.from('product_variants').insert({ product_id: productId, color: variant.color, image_url: variant.image_url || null }).select('id').single();
            if (variantError) throw variantError;
            const newVariantId = variantData.id;
            if (variant.inventory.length > 0) {
                const inventoryToInsert = variant.inventory.map(inv => ({ variant_id: newVariantId, size: inv.size, stock: inv.stock, price: inv.price }));
                const { error: inventoryError } = await supabase.from('inventory').insert(inventoryToInsert);
                if (inventoryError) throw inventoryError;
            }
        }
    } catch (error: any) {
        return { success: false, message: error.message };
    }
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/${productId}/edit`);
    return { success: true, message: "Producto actualizado con éxito" };
}

// --- NUEVA ACCIÓN PARA ELIMINAR PRODUCTOS ---
export async function deleteProductAction(productId: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

    if (error) {
        return { success: false, message: `Error al eliminar el producto: ${error.message}` };
    }

    // Revalidamos las rutas para que los cambios se reflejen en la UI
    revalidatePath('/admin/products');
    revalidatePath('/admin/dashboard');

    return { success: true, message: "Producto eliminado con éxito." };
}
