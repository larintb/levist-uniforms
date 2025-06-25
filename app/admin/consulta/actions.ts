"use server";

import { createClient } from "@/lib/supabase/server";

// Definimos un tipo para la respuesta que sea claro y predecible.
type SearchResult = {
    success: boolean;
    data?: any; // El tipo 'any' puede ser reemplazado por el tipo exacto de ProductDetails
    message?: string;
}

export async function searchProductByBarcode(barcode: string): Promise<SearchResult> {
    
    // Validar que el barcode no esté vacío en el servidor.
    if (!barcode) {
        return { success: false, message: "El código de barras no puede estar vacío." };
    }

    const supabase = await createClient();

    try {
        // Usamos la vista 'full_inventory_details' que ya tiene toda la información unificada y es pública.
        const { data, error } = await supabase
            .from('full_inventory_details')
            .select('*')
            .eq('barcode', barcode)
            .single(); // .single() es eficiente porque esperamos 0 o 1 resultado.

        // Manejo de errores de Supabase
        if (error) {
            // El código 'PGRST116' significa 'No rows found', lo cual no es un error para nosotros,
            // simplemente significa que no hay un producto con ese código de barras.
            if (error.code === 'PGRST116') {
                return { success: false, message: "Producto no encontrado." };
            }
            // Para cualquier otro error de base de datos, lo lanzamos.
            throw error;
        }

        // Si se encuentra el dato, la operación es exitosa.
        if (data) {
            return { success: true, data: data };
        } else {
            // Esto es un fallback, aunque .single() con PGRST116 debería cubrirlo.
            return { success: false, message: "Producto no encontrado." };
        }

    } catch (e: any) {
        console.error('Error en la búsqueda por código de barras:', e.message);
        return { success: false, message: "Error al conectar con la base de datos. Por favor, contacte a soporte." };
    }
}
