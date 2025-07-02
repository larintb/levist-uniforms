"use client";

// --- Importaciones ---
import React, { useState, useEffect, useMemo, useCallback, useTransition } from 'react';
import type { ProductWithDetails } from '@/app/admin/products/page';
import { createClient } from '@/lib/supabase/client';
import { deleteProductAction } from '@/app/admin/products/actions';
import Link from 'next/link';

// --- Iconos ---
const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
);

const SortIcon = ({ direction }: { direction: 'ascending' | 'descending' | null }) => {
    if (!direction) return null;
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 inline-block" viewBox="0 0 20 20" fill="currentColor">
            {direction === 'ascending' ? <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /> : <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />}
        </svg>
    );
};

// --- Iconos de Paginación ---
const ChevronDoubleLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
    </svg>
);

const ChevronLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
);

const ChevronRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
);

const ChevronDoubleRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
    </svg>
);

// --- Componentes Reutilizables ---

const StatCard = ({ title, value, color }: { title: string, value: number | string, color: string }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{ borderColor: color }}>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
);

const ConfirmationModal = ({
    isOpen,
    isPending,
    productName,
    onClose,
    onConfirm
}: {
    isOpen: boolean;
    isPending: boolean;
    productName?: string;
    onClose: () => void;
    onConfirm: () => void;
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm m-4">
                <h2 className="text-xl font-bold mb-2 text-gray-800">Confirmar Eliminación</h2>
                <p className="mb-6 text-gray-600">
                    ¿Seguro que quieres eliminar el producto <span className="font-semibold text-gray-900">&quot;{productName}&quot;</span>? Esta acción no se puede deshacer.
                </p>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50" disabled={isPending}>
                        Cancelar
                    </button>
                    <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors" disabled={isPending}>
                        {isPending ? "Eliminando..." : "Sí, eliminar"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Componente de Paginación con el nuevo diseño
const Pagination = ({
    currentPage,
    totalPages,
    setCurrentPage,
}: {
    currentPage: number;
    totalPages: number;
    setCurrentPage: (page: number) => void;
}) => {
    const handleFirstPage = () => setCurrentPage(1);
    const handlePreviousPage = () => setCurrentPage(Math.max(1, currentPage - 1));
    const handleNextPage = () => setCurrentPage(Math.min(totalPages, currentPage + 1));
    const handleLastPage = () => setCurrentPage(totalPages);

    const isFirstPage = currentPage === 1;
    const isLastPage = currentPage === totalPages;

    return (
        <nav className="inline-flex items-center -space-x-px" aria-label="Pagination">
             <button
                onClick={handleFirstPage}
                disabled={isFirstPage}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <span className="sr-only">Primera</span>
                <ChevronDoubleLeftIcon />
            </button>
            <button
                onClick={handlePreviousPage}
                disabled={isFirstPage}
                className="relative inline-flex items-center px-2 py-2 border-y border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <span className="sr-only">Anterior</span>
                <ChevronLeftIcon />
            </button>
            
            <span className="relative z-10 inline-flex items-center px-4 py-2 border border-blue-600 bg-blue-600 text-sm font-semibold text-white">
                {currentPage}
            </span>
            <span className="relative inline-flex items-center px-4 py-2 border-y border-gray-300 bg-white text-sm font-medium text-gray-700">
                de {totalPages}
            </span>

            <button
                onClick={handleNextPage}
                disabled={isLastPage}
                className="relative inline-flex items-center px-2 py-2 border-y border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <span className="sr-only">Siguiente</span>
                <ChevronRightIcon />
            </button>
             <button
                onClick={handleLastPage}
                disabled={isLastPage}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <span className="sr-only">Última</span>
                <ChevronDoubleRightIcon />
            </button>
        </nav>
    );
};

// --- Componente Principal ---
export function ProductsList() {
    const supabase = createClient();
    const [isPendingDelete, startTransition] = useTransition();

    const [products, setProducts] = useState<ProductWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof ProductWithDetails; direction: 'ascending' | 'descending' } | null>({ key: 'name', direction: 'ascending' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalProducts, setTotalProducts] = useState(0);
    const [modal, setModal] = useState<{ open: boolean; productId?: string; productName?: string }>({ open: false });

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let query = supabase
                .from('products')
                .select(`
                    id, 
                    name, 
                    sku_base, 
                    collections ( name, brands ( name ) )
                `, { count: 'exact' });

            if (searchTerm) {
                // La búsqueda en tablas anidadas (brands) es más compleja.
                // Esta implementación busca en `products` y `collections`.
                // Para una búsqueda profunda en `brands` se podría requerir una función de base de datos (RPC).
                 query = query.or(`name.ilike.%${searchTerm}%,sku_base.ilike.%${searchTerm}%`);
            }

            if (sortConfig) {
                const isAscending = sortConfig.direction === 'ascending';
                // El ordenamiento por brand_name requiere un manejo especial
                // que no es soportado directamente de esta forma en Supabase.
                // Se mantiene el ordenamiento por las otras columnas.
                if (sortConfig.key !== 'brand_name') {
                    query = query.order(sortConfig.key, { ascending: isAscending });
                }
            }

            const startIndex = (currentPage - 1) * itemsPerPage;
            query = query.range(startIndex, startIndex + itemsPerPage - 1);

            const { data: rawData, error: fetchError, count } = await query;

            if (fetchError) throw fetchError;
            
            const transformedProducts: ProductWithDetails[] = (rawData || []).map(product => {
                const collection = Array.isArray(product.collections) ? product.collections[0] : product.collections;
                const brand = collection && Array.isArray(collection.brands) ? collection.brands[0] : collection?.brands;
                
                return {
                    id: product.id,
                    name: product.name,
                    sku_base: product.sku_base,
                    collection_name: collection?.name || null,
                    brand_name: Array.isArray(brand) ? (brand[0]?.name ?? null) : (brand?.name ?? null),
                };
            });
            
            setProducts(transformedProducts);
            setTotalProducts(count || 0);
        } catch (err) {
            console.error("Error al cargar los productos:", err);
            setError(err instanceof Error ? err.message : 'Error desconocido al cargar los datos');
        } finally {
            setLoading(false);
        }
    }, [supabase, searchTerm, sortConfig, currentPage, itemsPerPage]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // Se elimina `processedProducts` y `paginatedProducts` porque la lógica ahora está en el servidor.
    const paginatedProducts = products;
    const totalPages = Math.ceil(totalProducts / itemsPerPage);

    const requestSort = useCallback((key: keyof ProductWithDetails) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig?.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
        setCurrentPage(1);
    }, [sortConfig]);

    useEffect(() => {
        if (totalPages > 0 && currentPage > totalPages) {
            setCurrentPage(totalPages);
        } else if (currentPage === 0 && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [totalPages, currentPage]);

    const handleItemsPerPageChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
    }, []);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    }, []);
    
    const openDeleteModal = (productId: string, productName: string) => setModal({ open: true, productId, productName });
    const closeDeleteModal = useCallback(() => setModal({ open: false }), []);

    const confirmDelete = useCallback(() => {
        if (!modal.productId) return;
        
        startTransition(async () => {
            await deleteProductAction(modal.productId!);
            closeDeleteModal();
            await fetchProducts();
        });
    }, [modal.productId, fetchProducts, closeDeleteModal]);

    const activeBrandsCount = useMemo(() => [...new Set(products.map(p => p.brand_name).filter(Boolean))].length, [products]);

    const tableHeaders = useMemo(() => [
        { key: 'name' as const, label: 'Producto', isSortable: true },
        { key: 'sku_base' as const, label: 'SKU Base', isSortable: true },
        { key: 'brand_name' as const, label: 'Marca', isSortable: true },
        { key: 'id' as const, label: 'Acciones', isSortable: false, className: 'text-center' }
    ], []);
    
    const handleSortClick = (key: keyof ProductWithDetails, isSortable: boolean) => {
        if (isSortable) {
            requestSort(key);
        }
    };
    
    return (
        <>
            <ConfirmationModal
                isOpen={modal.open}
                isPending={isPendingDelete}
                productName={modal.productName}
                onClose={closeDeleteModal}
                onConfirm={confirmDelete}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total de Productos" value={loading ? "..." : totalProducts} color="#3B82F6" />
                <StatCard title="Marcas Activas" value={loading ? "..." : activeBrandsCount} color="#10B981" />
            </div>

            <main className="bg-white p-6 md:p-8 rounded-lg shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-2xl font-semibold text-gray-800 self-start">Listado de Productos</h2>
                    <div className="w-full md:w-auto flex items-center gap-4">
                        <input type="text" placeholder="Buscar por producto, SKU o marca" value={searchTerm} onChange={handleSearchChange} className="w-full md:w-64 pl-4 pr-4 py-2 text-base bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-gray-500" />
                        <Link href="/admin/products/new" className="flex-shrink-0 flex items-center justify-center bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-300 shadow">
                            <PlusIcon /> Crear Producto
                        </Link>
                    </div>
                </div>

                {loading && <p className="text-center text-gray-500 py-8">Cargando productos...</p>}
                {error && <p className="text-center text-red-500 font-semibold py-8">{error}</p>}
                
                {!loading && !error && (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {tableHeaders.map((header) => (
                                            <th 
                                                key={header.key} 
                                                scope="col" 
                                                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${header.className || ''} ${header.isSortable ? 'cursor-pointer hover:bg-gray-100' : ''}`} 
                                                onClick={() => handleSortClick(header.key, header.isSortable)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSortClick(header.key, header.isSortable)}
                                                tabIndex={header.isSortable ? 0 : -1}
                                                role={header.isSortable ? "button" : undefined}
                                                aria-sort={header.isSortable ? (sortConfig?.key === header.key ? (sortConfig.direction === 'ascending' ? 'ascending' : 'descending') : 'none') : undefined}
                                            >
                                                {header.label}
                                                {header.isSortable && <SortIcon direction={sortConfig?.key === header.key ? sortConfig.direction : null} />}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {paginatedProducts.length > 0 ? paginatedProducts.map((product) => (
                                        <tr key={product.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{product.sku_base}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.brand_name || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                <Link href={`/admin/products/${product.id}/edit`} className="text-indigo-600 hover:text-indigo-900 mr-4 font-semibold">Editar</Link>
                                                <button onClick={() => openDeleteModal(product.id, product.name)} disabled={isPendingDelete} className="text-red-600 hover:text-red-900 disabled:opacity-50 font-semibold">Eliminar</button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={tableHeaders.length} className="text-center py-8 text-gray-500">
                                                No se encontraron productos que coincidan con la búsqueda.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* --- Sección de Paginación Actualizada --- */}
                         <div className="flex flex-col sm:flex-row items-center justify-between bg-white px-4 py-3 sm:px-6 border-t border-gray-200 mt-4">
                            <div className='flex items-center gap-4 mb-4 sm:mb-0'>
                                <p className="text-sm text-gray-700 whitespace-nowrap">
                                    Mostrando <span className="font-medium">{totalProducts > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> a <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalProducts)}</span> de <span className="font-medium">{totalProducts}</span> resultados
                                </p>
                                <div className="flex items-center gap-2">
                                     <label htmlFor="itemsPerPage" className="sr-only">Resultados por página</label>
                                     <select id="itemsPerPage" name="itemsPerPage" value={itemsPerPage} onChange={handleItemsPerPageChange} className="block rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm text-gray-600">
                                         <option value={10}>10</option>
                                         <option value={25}>25</option>
                                         <option value={50}>50</option>
                                     </select>
                                     <span className="text-sm text-gray-700 hidden md:inline">por página</span>
                                </div>
                            </div>
                            {totalPages > 0 && (
                                <Pagination 
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    setCurrentPage={setCurrentPage}
                                />
                            )}
                        </div>
                    </>
                )}
            </main>
        </>
    );
}