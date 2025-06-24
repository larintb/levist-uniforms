// app/admin/catalog/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Acción para crear una nueva marca
export async function createBrandAction(formData: FormData) {
    const supabase = await createClient();
    const name = formData.get('name') as string;

    if (!name) {
        return { success: false, message: "El nombre de la marca no puede estar vacío." };
    }

    const { error } = await supabase.from('brands').insert({ name });

    if (error) {
        return { success: false, message: `Error al crear la marca: ${error.message}` };
    }

    revalidatePath('/admin/catalog');
    revalidatePath('/admin/products/new');
    return { success: true };
}

// Acción para crear una nueva colección
export async function createCollectionAction(formData: FormData) {
    const supabase = await createClient();
    const name = formData.get('name') as string;
    const brand_id = formData.get('brand_id') as string;

    if (!name || !brand_id) {
        return { success: false, message: "Todos los campos son requeridos." };
    }

    const { error } = await supabase.from('collections').insert({ name, brand_id });

    if (error) {
        return { success: false, message: `Error al crear la colección: ${error.message}` };
    }

    revalidatePath('/admin/catalog');
    revalidatePath('/admin/products/new');
    return { success: true };
}

// NUEVA Acción para crear una nueva categoría
export async function createCategoryAction(formData: FormData) {
    const supabase = await createClient();
    const name = formData.get('name') as string;

    if (!name) {
        return { success: false, message: "El nombre de la categoría no puede estar vacío." };
    }

    const { error } = await supabase.from('categories').insert({ name });

    if (error) {
        return { success: false, message: `Error al crear la categoría: ${error.message}` };
    }

    revalidatePath('/admin/catalog'); // Actualiza la vista del catálogo
    revalidatePath('/admin/products/new'); // Actualiza el formulario de productos
    return { success: true };
}

export async function deleteBrandAction(id: string) {
  'use server';
  const supabase = await createClient();
  const { error } = await supabase.from('brands').delete().eq('id', id);

  if (error) {
    console.error('Error deleting brand:', error);
    // Revisa si el error es por una restricción de clave foránea (foreign key)
    if (error.code === '23503') {
        return { success: false, message: 'No se puede eliminar la marca porque tiene colecciones o productos asociados.' };
    }
    return { success: false, message: 'Error al eliminar la marca.' };
  }

  revalidatePath('/admin/catalog'); // Actualiza la página para mostrar los cambios
  return { success: true };
}

export async function deleteCollectionAction(id: string) {
    'use server';
    const supabase = await createClient();
    const { error } = await supabase.from('collections').delete().eq('id', id);

    if (error) {
        console.error('Error deleting collection:', error);
        if (error.code === '23503') {
            return { success: false, message: 'No se puede eliminar la colección porque tiene productos asociados.' };
        }
        return { success: false, message: 'Error al eliminar la colección.' };
    }

    revalidatePath('/admin/catalog');
    return { success: true };
}

export async function deleteCategoryAction(id: string) {
    'use server';
    const supabase = await createClient();
    const { error } = await supabase.from('categories').delete().eq('id', id);

    if (error) {
        console.error('Error deleting category:', error);
         if (error.code === '23503') {
            return { success: false, message: 'No se puede eliminar la categoría porque tiene productos asociados.' };
        }
        return { success: false, message: 'Error al eliminar la categoría.' };
    }

    revalidatePath('/admin/catalog');
    return { success: true };
}