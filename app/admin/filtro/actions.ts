"use server";

import { createClient } from "@/lib/supabase/server";

// --- Tipos de Datos ---
type FilteredInventoryItem = {
    inventory_id: string;
    product_id: string;
    product_name: string;
    sku_base: string;
    color: string;
    size: string;
    stock: number;
    price: string;
    image_url: string | null;
    brand: string;
    collection: string;
    category: string;
};

// Tipo para los datos que vienen de la vista full_inventory_details
type FullInventoryDetailsRow = {
    inventory_id: string;
    product_id: string;
    product_name: string;
    sku: string;
    color: string;
    size: string;
    stock: number;
    price: number | null;
    image_url: string | null;
    brand: string;
    collection: string;
    category: string;
    is_available: boolean;
};

type FilterResult = {
    success: boolean;
    data: FilteredInventoryItem[];
    error?: string;
};

// Nueva función para obtener todas las opciones disponibles sin filtros restrictivos
export async function getAllFilterOptionsAction(): Promise<{
    success: boolean;
    categories: string[];
    colors: string[];
    error?: string;
}> {
    try {
        const supabase = await createClient();

        // Usar la vista para obtener categorías y colores únicos
        const { data: viewData, error } = await supabase
            .from('full_inventory_details')
            .select('category, color');

        if (error) {
            throw error;
        }

        // Extraer valores únicos y ordenar
        const uniqueCategories = [...new Set(viewData.map(item => item.category))].filter(Boolean).sort();
        const uniqueColors = [...new Set(viewData.map(item => item.color))].filter(Boolean).sort();

        return {
            success: true,
            categories: uniqueCategories,
            colors: uniqueColors
        };

    } catch (error) {
        console.error('Error getting filter options:', error);
        return {
            success: false,
            categories: [],
            colors: [],
            error: 'Error al obtener opciones de filtro'
        };
    }
}

// Nueva función para obtener colores específicos de una categoría
export async function getColorsByCategoryAction(category: string): Promise<{
    success: boolean;
    colors: string[];
    error?: string;
}> {
    try {
        const supabase = await createClient();

        // Obtener colores únicos para la categoría específica
        const { data: viewData, error } = await supabase
            .from('full_inventory_details')
            .select('color')
            .eq('category', category);

        if (error) {
            throw error;
        }

        // Extraer colores únicos y ordenar
        const uniqueColors = [...new Set(viewData.map(item => item.color))].filter(Boolean).sort();

        return {
            success: true,
            colors: uniqueColors
        };

    } catch (error) {
        console.error('Error getting colors by category:', error);
        return {
            success: false,
            colors: [],
            error: 'Error al obtener colores de la categoría'
        };
    }
}

// Nueva función para obtener SKUs específicos de una categoría y color
export async function getSkusByCategoryAndColorAction(category: string, color: string): Promise<{
    success: boolean;
    skus: string[];
    error?: string;
}> {
    try {
        const supabase = await createClient();

        // Obtener SKUs únicos para la combinación categoría + color específica
        const { data: viewData, error } = await supabase
            .from('full_inventory_details')
            .select('sku')
            .eq('category', category)
            .eq('color', color);

        if (error) {
            throw error;
        }

        // Extraer SKUs únicos y ordenar
        const uniqueSkus = [...new Set(viewData.map(item => item.sku))].filter(Boolean).sort();

        return {
            success: true,
            skus: uniqueSkus
        };

    } catch (error) {
        console.error('Error getting SKUs by category and color:', error);
        return {
            success: false,
            skus: [],
            error: 'Error al obtener SKUs de la categoría y color'
        };
    }
}

export async function getInventoryFilterAction(
    category: string = '', 
    color: string = '',
    sku: string = ''
): Promise<FilterResult> {
    try {
        const supabase = await createClient();

        // Usar la vista full_inventory_details en lugar de múltiples JOINs
        let query = supabase
            .from('full_inventory_details')
            .select('*')
            .eq('is_available', true)
            .gte('stock', 0);

        // Aplicar filtros si existen
        if (category) {
            query = query.eq('category', category);
        }

        if (color) {
            query = query.eq('color', color);
        }

        if (sku) {
            query = query.eq('sku', sku);
        }

        const { data: inventoryData, error } = await query;

        if (error) {
            console.error('Error fetching filtered inventory:', error);
            return {
                success: false,
                data: [],
                error: 'Error al consultar el inventario'
            };
        }

        if (!inventoryData || inventoryData.length === 0) {
            return {
                success: true,
                data: []
            };
        }

        // Transformar los datos para el frontend (más simple ahora)
        const transformedData: FilteredInventoryItem[] = inventoryData.map((item: FullInventoryDetailsRow) => ({
            inventory_id: item.inventory_id,
            product_id: item.product_id,
            product_name: item.product_name,
            sku_base: item.sku,
            color: item.color,
            size: item.size,
            stock: item.stock,
            price: item.price?.toString() || '0',
            image_url: item.image_url,
            brand: item.brand,
            collection: item.collection,
            category: item.category
        })).filter(item => {
            // Filtrar items que tengan datos válidos
            const hasValidData = item.product_name && 
                item.sku_base && 
                item.color &&
                item.size;
            
            // Los filtros ya se aplicaron en la consulta SQL, pero por seguridad:
            const categoryMatches = !category || item.category === category;
            const colorMatches = !color || item.color === color;
            const skuMatches = !sku || item.sku_base === sku;
            
            return hasValidData && categoryMatches && colorMatches && skuMatches;
        });

        return {
            success: true,
            data: transformedData
        };

    } catch (error) {
        console.error('Error in getInventoryFilterAction:', error);
        return {
            success: false,
            data: [],
            error: 'Error inesperado al procesar la consulta'
        };
    }
}
