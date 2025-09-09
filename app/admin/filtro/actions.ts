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
    product_image: string | null;
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
    product_image: string | null;
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
export async function getAllFilterOptionsAction(includeOutOfStock: boolean = false): Promise<{
    success: boolean;
    categories: string[];
    colors: string[];
    skus: string[];
    brands: string[];
    error?: string;
}> {
    try {
        const supabase = await createClient();

        // Usar la vista para obtener categorías, colores, SKUs y marcas únicos
        // Filtrar por stock según la preferencia del usuario
        let query = supabase
            .from('full_inventory_details')
            .select('category, color, sku, brand');

        if (!includeOutOfStock) {
            query = query.gt('stock', 0);
        }

        const { data: viewData, error } = await query;

        if (error) {
            throw error;
        }

        // Extraer valores únicos y ordenar, filtrando valores null/undefined
        const uniqueCategories = [...new Set(viewData.map(item => item.category))].filter(Boolean).sort();
        const uniqueColors = [...new Set(viewData.map(item => item.color))].filter(Boolean).sort();
        const uniqueSkus = [...new Set(viewData.map(item => item.sku))].filter(Boolean).sort();
        const uniqueBrands = [...new Set(viewData.map(item => item.brand))].filter(Boolean).sort();

        return {
            success: true,
            categories: uniqueCategories,
            colors: uniqueColors,
            skus: uniqueSkus,
            brands: uniqueBrands
        };

    } catch (error) {
        console.error('Error getting filter options:', error);
        return {
            success: false,
            categories: [],
            colors: [],
            skus: [],
            brands: [],
            error: 'Error al obtener opciones de filtro'
        };
    }
}

// Nueva función para obtener colores específicos de una categoría
export async function getColorsByCategoryAction(category: string, includeOutOfStock: boolean = false): Promise<{
    success: boolean;
    colors: string[];
    error?: string;
}> {
    try {
        const supabase = await createClient();

        // Obtener colores únicos para la categoría específica
        // Filtrar por stock según la preferencia del usuario
        let query = supabase
            .from('full_inventory_details')
            .select('color')
            .eq('category', category);

        if (!includeOutOfStock) {
            query = query.gt('stock', 0);
        }

        const { data: viewData, error } = await query;

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

// Nueva función para obtener SKUs específicos de una categoría (sin requerir color)
export async function getSkusByCategoryAction(category: string): Promise<{
    success: boolean;
    skus: string[];
    error?: string;
}> {
    try {
        const supabase = await createClient();

        // Obtener SKUs únicos para la categoría específica, sin filtrar por color
        // Solo incluir productos que tienen stock disponible
        const { data: viewData, error } = await supabase
            .from('full_inventory_details')
            .select('sku')
            .eq('category', category)
            .gt('stock', 0);

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
        console.error('Error getting SKUs by category:', error);
        return {
            success: false,
            skus: [],
            error: 'Error al obtener SKUs de la categoría'
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
        // Solo incluir productos que tienen stock disponible
        const { data: viewData, error } = await supabase
            .from('full_inventory_details')
            .select('sku')
            .eq('category', category)
            .eq('color', color)
            .gt('stock', 0);

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

// Nueva función para obtener SKUs solo por color (sin requerir categoría)
export async function getSkusByColorAction(color: string): Promise<{
    success: boolean;
    skus: string[];
    error?: string;
}> {
    try {
        const supabase = await createClient();

        // Obtener SKUs únicos para el color específico, sin filtrar por categoría
        // Solo incluir productos que tienen stock disponible
        const { data: viewData, error } = await supabase
            .from('full_inventory_details')
            .select('sku')
            .eq('color', color)
            .gt('stock', 0);

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
        console.error('Error getting SKUs by color:', error);
        return {
            success: false,
            skus: [],
            error: 'Error al obtener SKUs del color'
        };
    }
}

// Nueva función para obtener marcas específicas de una categoría
export async function getBrandsByCategoryAction(category: string): Promise<{
    success: boolean;
    brands: string[];
    error?: string;
}> {
    try {
        const supabase = await createClient();

        // Obtener marcas únicas para la categoría específica
        // Solo incluir productos que tienen stock disponible
        const { data: viewData, error } = await supabase
            .from('full_inventory_details')
            .select('brand')
            .eq('category', category)
            .gt('stock', 0);

        if (error) {
            throw error;
        }

        // Extraer marcas únicas y ordenar
        const uniqueBrands = [...new Set(viewData.map(item => item.brand))].filter(Boolean).sort();

        return {
            success: true,
            brands: uniqueBrands
        };

    } catch (error) {
        console.error('Error getting brands by category:', error);
        return {
            success: false,
            brands: [],
            error: 'Error al obtener marcas de la categoría'
        };
    }
}

// Nueva función para obtener marcas específicas de un color
export async function getBrandsByColorAction(color: string): Promise<{
    success: boolean;
    brands: string[];
    error?: string;
}> {
    try {
        const supabase = await createClient();

        // Obtener marcas únicas para el color específico
        // Solo incluir productos que tienen stock disponible
        const { data: viewData, error } = await supabase
            .from('full_inventory_details')
            .select('brand')
            .eq('color', color)
            .gt('stock', 0);

        if (error) {
            throw error;
        }

        // Extraer marcas únicas y ordenar
        const uniqueBrands = [...new Set(viewData.map(item => item.brand))].filter(Boolean).sort();

        return {
            success: true,
            brands: uniqueBrands
        };

    } catch (error) {
        console.error('Error getting brands by color:', error);
        return {
            success: false,
            brands: [],
            error: 'Error al obtener marcas del color'
        };
    }
}

// Nueva función para obtener marcas específicas de una categoría y color
export async function getBrandsByCategoryAndColorAction(category: string, color: string): Promise<{
    success: boolean;
    brands: string[];
    error?: string;
}> {
    try {
        const supabase = await createClient();

        // Obtener marcas únicas para la combinación categoría + color específica
        // Solo incluir productos que tienen stock disponible
        const { data: viewData, error } = await supabase
            .from('full_inventory_details')
            .select('brand')
            .eq('category', category)
            .eq('color', color)
            .gt('stock', 0);

        if (error) {
            throw error;
        }

        // Extraer marcas únicas y ordenar
        const uniqueBrands = [...new Set(viewData.map(item => item.brand))].filter(Boolean).sort();

        return {
            success: true,
            brands: uniqueBrands
        };

    } catch (error) {
        console.error('Error getting brands by category and color:', error);
        return {
            success: false,
            brands: [],
            error: 'Error al obtener marcas de la categoría y color'
        };
    }
}

export async function getInventoryFilterAction(
    category: string = '', 
    color: string = '',
    sku: string = '',
    brand: string = '',
    includeOutOfStock: boolean = false
): Promise<FilterResult> {
    try {
        const supabase = await createClient();

        // Usar la vista full_inventory_details en lugar de múltiples JOINs
        let query = supabase
            .from('full_inventory_details')
            .select('*')
            .eq('is_available', true);

        // Filtrar por stock según la preferencia del usuario
        if (!includeOutOfStock) {
            query = query.gt('stock', 0);
        }

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

        if (brand) {
            query = query.eq('brand', brand);
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
            product_image: item.product_image,
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
            const brandMatches = !brand || item.brand === brand;
            
            return hasValidData && categoryMatches && colorMatches && skuMatches && brandMatches;
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
