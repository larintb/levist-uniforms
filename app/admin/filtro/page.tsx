"use client";

import React, { useState, useTransition } from 'react';
import { getInventoryFilterAction, getAllFilterOptionsAction, getColorsByCategoryAction, getSkusByCategoryAndColorAction } from './actions';
import Image from 'next/image';

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

type GroupedBySku = {
    [sku: string]: {
        product_name: string;
        brand: string;
        collection: string;
        category: string;
        color: string;
        image_url: string | null;
        sizes: {
            size: string;
            stock: number;
            price: string;
            inventory_id: string;
        }[];
    };
};

// --- Iconos ---
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
);

const FilterIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
    </svg>
);

export default function FiltroInventarioPage() {
    const [filteredInventory, setFilteredInventory] = useState<FilteredInventoryItem[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [colors, setColors] = useState<string[]>([]);
    const [allColors, setAllColors] = useState<string[]>([]); // Todos los colores disponibles
    const [skus, setSkus] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Estados de filtros
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedColor, setSelectedColor] = useState<string>('');
    const [selectedSku, setSelectedSku] = useState<string>('');
    
    const [isPending, startTransition] = useTransition();

    // Cargar categorías y colores disponibles al montar el componente
    React.useEffect(() => {
        const loadOptions = async () => {
            try {
                const result = await getAllFilterOptionsAction();
                if (result.success) {
                    // Ya vienen ordenadas de la función
                    setCategories(result.categories);
                    setAllColors(result.colors); // Guardamos todos los colores
                    setColors(result.colors); // Inicialmente mostramos todos los colores
                }
            } catch (err) {
                console.error('Error cargando opciones:', err);
            }
        };
        loadOptions();
    }, []);

    // Actualizar colores cuando cambie la categoría seleccionada
    React.useEffect(() => {
        const updateColorsForCategory = async () => {
            if (selectedCategory) {
                try {
                    const result = await getColorsByCategoryAction(selectedCategory);
                    if (result.success) {
                        setColors(result.colors);
                        // Si el color seleccionado no está disponible en esta categoría, limpiarlo
                        if (selectedColor && !result.colors.includes(selectedColor)) {
                            setSelectedColor('');
                        }
                    }
                } catch (err) {
                    console.error('Error cargando colores por categoría:', err);
                }
            } else {
                // Si no hay categoría seleccionada, mostrar todos los colores
                setColors(allColors);
            }
        };
        updateColorsForCategory();
    }, [selectedCategory, allColors, selectedColor]);

    // Actualizar SKUs cuando cambien categoría Y color
    React.useEffect(() => {
        const updateSkusForCategoryAndColor = async () => {
            if (selectedCategory && selectedColor) {
                try {
                    const result = await getSkusByCategoryAndColorAction(selectedCategory, selectedColor);
                    if (result.success) {
                        setSkus(result.skus);
                        // Si el SKU seleccionado no está disponible en esta combinación, limpiarlo
                        if (selectedSku && !result.skus.includes(selectedSku)) {
                            setSelectedSku('');
                        }
                    }
                } catch (err) {
                    console.error('Error cargando SKUs por categoría y color:', err);
                }
            } else {
                // Si no hay categoría Y color seleccionados, limpiar SKUs
                setSkus([]);
                setSelectedSku('');
            }
        };
        updateSkusForCategoryAndColor();
    }, [selectedCategory, selectedColor, selectedSku]);

    const handleFilter = () => {
        if (!selectedCategory && !selectedColor && !selectedSku) {
            setError('Por favor selecciona al menos un filtro');
            return;
        }

        startTransition(async () => {
            try {
                setLoading(true);
                setError(null);
                
                const result = await getInventoryFilterAction(selectedCategory, selectedColor, selectedSku);
                
                if (result.success) {
                    setFilteredInventory(result.data);
                } else {
                    setError(result.error || 'Error al filtrar inventario');
                }
            } catch (err) {
                setError('Error inesperado al filtrar');
                console.error('Error en filtro:', err);
            } finally {
                setLoading(false);
            }
        });
    };

    const handleClearFilters = () => {
        setSelectedCategory('');
        setSelectedColor('');
        setSelectedSku('');
        setFilteredInventory([]);
        setError(null);
        // Restaurar todos los colores cuando se limpien los filtros
        setColors(allColors);
        setSkus([]);
    };

    // Agrupar por SKU + Color (para separar variantes de diferentes colores)
    const groupedInventory: GroupedBySku = filteredInventory.reduce((acc, item) => {
        const key = `${item.sku_base}-${item.color}`; // Agrupamos por SKU + Color
        if (!acc[key]) {
            acc[key] = {
                product_name: item.product_name,
                brand: item.brand,
                collection: item.collection,
                category: item.category,
                color: item.color,
                image_url: item.image_url,
                sizes: []
            };
        }
        acc[key].sizes.push({
            size: item.size,
            stock: item.stock,
            price: item.price,
            inventory_id: item.inventory_id
        });
        return acc;
    }, {} as GroupedBySku);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            <div className="max-w-7xl mx-auto p-6 lg:p-8">
                
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Filtro de Inventario</h1>
                    <p className="text-lg text-gray-600">
                        Busca productos por categoría, color y SKU específico
                    </p>
                </div>

                {/* Formulario de Filtros */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
                    <div className="flex items-center gap-2 mb-6">
                        <FilterIcon className="h-6 w-6 text-blue-600" />
                        <h2 className="text-xl font-semibold text-gray-900">Filtros de Búsqueda</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        {/* Selector de Categoría */}
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                                Categoría
                            </label>
                            <select
                                id="category"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            >
                                <option value="">Todas las categorías</option>
                                {categories.map((category) => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Selector de Color */}
                        <div>
                            <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-2">
                                Color
                            </label>
                            <select
                                id="color"
                                value={selectedColor}
                                onChange={(e) => setSelectedColor(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            >
                                <option value="">Todos los colores</option>
                                {colors.map((color) => (
                                    <option key={color} value={color}>
                                        {color}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Selector de SKU */}
                        <div>
                            <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-2">
                                SKU
                                {(!selectedCategory || !selectedColor) && (
                                    <span className="text-xs text-gray-500 ml-1">(Selecciona categoría y color primero)</span>
                                )}
                            </label>
                            <select
                                id="sku"
                                value={selectedSku}
                                onChange={(e) => setSelectedSku(e.target.value)}
                                disabled={!selectedCategory || !selectedColor}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                            >
                                <option value="">Todos los SKUs</option>
                                {skus.map((sku) => (
                                    <option key={sku} value={sku}>
                                        {sku}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={handleFilter}
                            disabled={isPending || loading}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                        >
                            <SearchIcon className="h-5 w-5" />
                            {loading ? 'Filtrando...' : 'Filtrar Inventario'}
                        </button>
                        
                        <button
                            onClick={handleClearFilters}
                            disabled={isPending || loading}
                            className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                        >
                            Limpiar Filtros
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
                        <p className="text-red-700 font-medium">{error}</p>
                    </div>
                )}

                {/* Resultados */}
                {Object.keys(groupedInventory).length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">
                            Resultados ({Object.keys(groupedInventory).length} productos encontrados)
                        </h2>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {Object.entries(groupedInventory)
                                .sort((a, b) => a[1].product_name.localeCompare(b[1].product_name))
                                .map(([sku, product]) => (
                                <div key={sku} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                    {/* Imagen y título */}
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="flex-shrink-0 w-16 h-16">
                                            {product.image_url ? (
                                                <Image
                                                    src={product.image_url}
                                                    alt={product.product_name}
                                                    width={64}
                                                    height={64}
                                                    className="w-full h-full object-cover rounded-md"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                                                    <span className="text-gray-400 text-xs">Sin imagen</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                                                {product.product_name}
                                            </h3>
                                            <p className="text-xs text-gray-600 mb-1">
                                                <span className="font-medium">SKU:</span> {sku.split('-')[0]}
                                            </p>
                                            <p className="text-xs text-gray-600 mb-1">
                                                <span className="font-medium">Color:</span> {product.color}
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                                    {product.category}
                                                </span>
                                                <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                                    {product.brand}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tallas disponibles */}
                                    <div>
                                        <h4 className="font-medium text-gray-900 text-sm mb-2">
                                            Tallas Disponibles:
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {product.sizes
                                                .sort((a, b) => a.size.localeCompare(b.size))
                                                .map((sizeData) => (
                                                <div
                                                    key={sizeData.inventory_id}
                                                    className={`text-center py-2 px-3 rounded-md border text-xs ${
                                                        sizeData.stock > 0
                                                            ? 'bg-green-50 border-green-200 text-green-800'
                                                            : 'bg-red-50 border-red-200 text-red-800'
                                                    }`}
                                                >
                                                    <div className="font-medium">{sizeData.size}</div>
                                                    <div className="text-xs">
                                                        Stock: {sizeData.stock}
                                                    </div>
                                                    <div className="text-xs font-medium">
                                                        ${parseFloat(sizeData.price).toFixed(2)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Estado vacío */}
                {filteredInventory.length === 0 && !loading && !error && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
                        <FilterIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Selecciona filtros para buscar
                        </h3>
                        <p className="text-gray-600">
                            Elige una categoría y/o color para ver los productos disponibles
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
