// app/admin/dashboard/page.tsx
"use client";

// Importamos useMemo y cambiamos useState por useMemo para optimizar el renderizado
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';

// --- Tipos y Componentes de Iconos (sin cambios) ---
type InventoryItem = {
    inventory_id: string;
    product_id: string;
    product_name: string;
    color: string;
    sku: string;
    size: string;
    stock: number;
    price: number;
    brand: string;
    collection: string;
    category: string;
    image_url: string | null;
};

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);

const ImageIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
);

// NUEVO: Icono para indicar el ordenamiento
const SortIcon = ({ direction }: { direction: 'ascending' | 'descending' | null }) => {
    if (!direction) return null;
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 inline-block" viewBox="0 0 20 20" fill="currentColor">
            {direction === 'ascending' ? (
                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
            ) : (
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            )}
        </svg>
    );
};

const StatCard = ({ title, value, color }: { title: string, value: number | string, color: string }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{ borderColor: color }}>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
);

// --- Componente Principal ---
export default function AdminDashboardPage() {
    const supabase = createClient();
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // --- NUEVO: Estados para ordenamiento y paginación ---
    const [sortConfig, setSortConfig] = useState<{ key: keyof InventoryItem; direction: 'ascending' | 'descending' } | null>({ key: 'product_name', direction: 'ascending' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10); // Por defecto 10 items por página
    const [totalItems, setTotalItems] = useState(0);

    // --- NUEVO: Estados para las estadísticas ---
    const [stats, setStats] = useState({
        totalSkus: 0,
        lowStock: 0,
        outOfStock: 0,
        activeBrands: 0,
    });
    const [loadingStats, setLoadingStats] = useState(true);

    const fetchInventory = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            let query = supabase.from('full_inventory_details').select('*', { count: 'exact' });

            if (searchTerm) {
                query = query.or(`product_name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%`);
            }

            if (sortConfig) {
                query = query.order(sortConfig.key, { ascending: sortConfig.direction === 'ascending' });
            }

            const startIndex = (currentPage - 1) * itemsPerPage;
            query = query.range(startIndex, startIndex + itemsPerPage - 1);

            const { data, error: fetchError, count } = await query;
            
            if (fetchError) {
                throw fetchError;
            }
            
            setInventory(data || []);
            setTotalItems(count || 0);
        } catch (err) {
            console.error("Error al cargar los datos del dashboard:", err);
            setError(err instanceof Error ? err.message : 'Error desconocido al cargar los datos');
        } finally {
            setLoading(false);
        }
    }, [supabase, searchTerm, sortConfig, currentPage, itemsPerPage]);

    const fetchStats = useCallback(async () => {
        try {
            setLoadingStats(true);
            const { count: totalSkus } = await supabase.from('inventory').select('id', { count: 'exact', head: true });
            const { count: lowStock } = await supabase.from('inventory').select('id', { count: 'exact', head: true }).gt('stock', 0).lt('stock', 5);
            const { count: outOfStock } = await supabase.from('inventory').select('id', { count: 'exact', head: true }).eq('stock', 0);
            const { data: brandsData, error: brandsError } = await supabase.from('brands').select('id');
            if(brandsError) throw brandsError;

            setStats({
                totalSkus: totalSkus || 0,
                lowStock: lowStock || 0,
                outOfStock: outOfStock || 0,
                activeBrands: brandsData?.length || 0,
            });

        } catch (err) {
            console.error("Error al cargar las estadísticas:", err);
            // Opcional: manejar el error de estadísticas en la UI
        } finally {
            setLoadingStats(false);
        }
    }, [supabase]);


    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);


    // --- Lógica de Procesamiento de Datos (Filtrar, Ordenar, Paginar) ---
    // Se elimina `processedInventory` y `paginatedInventory` porque la lógica ahora está en el servidor.
    const paginatedInventory = inventory;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // --- NUEVO: Función para manejar el clic en los encabezados de la tabla ---
    const requestSort = useCallback((key: keyof InventoryItem) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
        setCurrentPage(1); // Volver a la primera página al cambiar el orden
    }, [sortConfig]);

    // --- Efecto para resetear la página si la búsqueda cambia ---
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, itemsPerPage]);

    // --- Handlers para paginación ---
    const handlePreviousPage = useCallback(() => {
        setCurrentPage(prev => Math.max(1, prev - 1));
    }, []);

    const handleNextPage = useCallback(() => {
        setCurrentPage(prev => Math.min(totalPages, prev + 1));
    }, [totalPages]);

    const handleItemsPerPageChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setItemsPerPage(Number(e.target.value));
    }, []);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    }, []);

    // --- Estadísticas (sin cambios) ---
    // Estas líneas se eliminan porque las estadísticas ahora se obtienen del servidor y no se usan estas variables.
    // const lowStockCount = useMemo(() => inventory.filter(i => i.stock > 0 && i.stock < 5).length, [inventory]);
    // const outOfStockCount = useMemo(() => inventory.filter(i => i.stock === 0).length, [inventory]);
    // const activeBrandsCount = useMemo(() => [...new Set(inventory.map(i => i.brand))].length, [inventory]);
    
    // --- Columnas de la tabla para hacer el código más limpio ---
    const tableHeaders: { key: keyof InventoryItem; label: string; isSortable: boolean; className?: string }[] = useMemo(() => [
        { key: 'image_url', label: 'Imagen', isSortable: false },
        { key: 'product_name', label: 'Producto', isSortable: true },
        { key: 'sku', label: 'SKU', isSortable: true },
        { key: 'size', label: 'Talla', isSortable: true },
        { key: 'stock', label: 'Stock', isSortable: true, className: 'text-center' },
        { key: 'price', label: 'Precio', isSortable: true, className: 'text-right' },
        { key: 'inventory_id', label: 'Acciones', isSortable: false, className: 'text-center' }
    ], []);

    return (
        <div className="p-4 md:p-8">
            <header className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-lg text-gray-600">Resumen general de tu tienda.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total de SKUs" value={loadingStats ? "..." : stats.totalSkus} color="#3B82F6" />
                <StatCard title="Stock Bajo (<5)" value={loadingStats ? "..." : stats.lowStock} color="#F59E0B" />
                <StatCard title="Agotados" value={loadingStats ? "..." : stats.outOfStock} color="#EF4444" />
                <StatCard title="Marcas Activas" value={loadingStats ? "..." : stats.activeBrands} color="#10B981" />
            </div>

            <main className="bg-white p-6 md:p-8 rounded-lg shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4 md:mb-0">Inventario Actual</h2>
                    <div className="w-full md:w-auto flex items-center gap-4">
                        <input
                            type="text"
                            placeholder="Buscar por producto"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="text-gray-600 w-full pl-12 pr-32 py-4 text-lg bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-gray-600"
                        />
                        <Link href="/admin/products/new" className="flex items-center justify-center bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-300 shadow">
                            <PlusIcon />
                            Crear Producto
                        </Link>
                    </div>
                </div>

                {loading && <p className="text-center text-gray-500 py-4">Cargando inventario...</p>}
                {error && <p className="text-center text-red-500 font-semibold py-4">{error}</p>}
                
                {!loading && !error && (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {/* --- NUEVO: Encabezados de tabla dinámicos y clickeables --- */}
                                        {tableHeaders.map((header) => (
                                            <th
                                                key={header.key}
                                                scope="col"
                                                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${header.className || ''} ${header.isSortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                                                onClick={() => header.isSortable && requestSort(header.key)}
                                                role={header.isSortable ? 'button' : undefined}
                                                tabIndex={header.isSortable ? 0 : undefined}
                                                onKeyDown={header.isSortable ? (e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        requestSort(header.key);
                                                    }
                                                } : undefined}
                                            >
                                                {header.label}
                                                {header.isSortable && <SortIcon direction={sortConfig?.key === header.key ? sortConfig.direction : null} />}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {/* --- Usamos los datos paginados in lugar de los filtrados --- */}
                                    {paginatedInventory.map((item) => (
                                        <tr key={item.inventory_id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    {item.image_url ? (
                                                        <Image 
                                                            src={item.image_url} 
                                                            alt={`Imagen de ${item.product_name}`} 
                                                            width={40} 
                                                            height={40} 
                                                            className="h-10 w-10 rounded-md object-cover" 
                                                        />
                                                    ) : (
                                                        <div className="h-10 w-10 flex items-center justify-center bg-gray-100 rounded-md">
                                                            <ImageIcon className="h-6 w-6 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                                                <div className="text-sm text-gray-500">{item.color}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.sku}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.size}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    item.stock === 0 
                                                        ? 'bg-red-100 text-red-800' 
                                                        : item.stock < 5 
                                                            ? 'bg-yellow-100 text-yellow-800' 
                                                            : 'bg-green-100 text-green-800'
                                                }`}>
                                                    {item.stock}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right text-gray-500">
                                                ${item.price.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                <Link 
                                                    href={`/admin/products/${item.product_id}/edit`} 
                                                    className="text-indigo-600 hover:text-indigo-900 focus:outline-none focus:underline"
                                                >
                                                    Editar
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* --- NUEVO: Controles de Paginación Mejorados --- */}
                        <div className="bg-gray-50 px-4 py-6 sm:px-6 border-t border-gray-200">
                            {/* Mobile View */}
                            <div className="flex-1 flex justify-between sm:hidden">
                                <button 
                                    onClick={handlePreviousPage} 
                                    disabled={currentPage === 1} 
                                    className="relative inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-sm font-medium rounded-lg text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 disabled:hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                                >
                                    <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Anterior
                                </button>
                                <button 
                                    onClick={handleNextPage} 
                                    disabled={currentPage === totalPages || totalPages === 0} 
                                    className="relative inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-sm font-medium rounded-lg text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 disabled:hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                                >
                                    Siguiente
                                    <svg className="ml-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>

                            {/* Desktop View */}
                            <div className="hidden sm:flex sm:items-center sm:justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <p className="text-sm text-gray-700 font-medium">
                                            Mostrando <span className="font-semibold text-gray-900">{Math.min(1 + (currentPage - 1) * itemsPerPage, totalItems)}</span> - <span className="font-semibold text-gray-900">{Math.min(currentPage * itemsPerPage, totalItems)}</span> de <span className="font-semibold text-gray-900">{totalItems}</span> resultados
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <label htmlFor="itemsPerPage" className="text-sm font-medium text-gray-700">
                                            Mostrar:
                                        </label>
                                        <select
                                            id="itemsPerPage"
                                            name="itemsPerPage"
                                            className="block w-auto rounded-lg border-gray-300 shadow-sm bg-white px-3 py-2 text-sm font-medium text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200"
                                            value={itemsPerPage}
                                            onChange={handleItemsPerPageChange}
                                        >
                                            <option value={10}>10</option>
                                            <option value={25}>25</option>
                                            <option value={50}>50</option>
                                            <option value={100}>100</option>
                                        </select>
                                        <span className="text-sm font-medium text-gray-700">por página</span>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    {/* Botón Primera Página */}
                                    <button 
                                        onClick={() => setCurrentPage(1)} 
                                        disabled={currentPage === 1} 
                                        className="relative inline-flex items-center px-3 py-2 bg-white border border-gray-300 text-sm font-medium rounded-lg text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 disabled:hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                                        title="Primera página"
                                    >
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>

                                    {/* Botón Página Anterior */}
                                    <button 
                                        onClick={handlePreviousPage} 
                                        disabled={currentPage === 1} 
                                        className="relative inline-flex items-center px-3 py-2 bg-white border border-gray-300 text-sm font-medium rounded-lg text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 disabled:hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                                        title="Página anterior"
                                    >
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>

                                    {/* Botón Página Siguiente */}
                                    <button 
                                        onClick={handleNextPage} 
                                        disabled={currentPage === totalPages || totalPages === 0} 
                                        className="relative inline-flex items-center px-3 py-2 bg-white border border-gray-300 text-sm font-medium rounded-lg text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 disabled:hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                                        title="Página siguiente"
                                    >
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>

                                    {/* Botón Última Página */}
                                    <button 
                                        onClick={() => setCurrentPage(totalPages)} 
                                        disabled={currentPage === totalPages || totalPages === 0} 
                                        className="relative inline-flex items-center px-3 py-2 bg-white border border-gray-300 text-sm font-medium rounded-lg text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 disabled:hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                                        title="Última página"
                                    >
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
