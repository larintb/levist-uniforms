// app/(admin)/catalog/actions.ts
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

    revalidatePath('/catalog');
    revalidatePath('/products/new');
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

    revalidatePath('/catalog');
    revalidatePath('/products/new');
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

    revalidatePath('/catalog'); // Actualiza la vista del catálogo
    revalidatePath('/products/new'); // Actualiza el formulario de productos
    return { success: true };
}
