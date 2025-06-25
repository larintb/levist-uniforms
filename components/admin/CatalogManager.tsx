"use client";

import React, { useTransition, useRef } from 'react';
import { 
    createBrandAction, 
    createCollectionAction, 
    createCategoryAction,
    deleteBrandAction,      // <- Importar acción de borrado
    deleteCollectionAction, // <- Importar acción de borrado
    deleteCategoryAction    // <- Importar acción de borrado
} from '@/app/admin/catalog/actions';

// Tipos de datos
type Brand = { id: string; name: string };
type Collection = { id: string; name: string; brands: { name: string | null } | null; };
type Category = { id: string; name: string };

interface CatalogManagerProps {
    initialBrands: Brand[];
    initialCollections: Collection[];
    initialCategories: Category[];
}

// Iconos para los botones
const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>;
const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.58.22-2.365.468a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193v-.443A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" /></svg>;


export function CatalogManager({ initialBrands, initialCollections, initialCategories }: CatalogManagerProps) {
    const [isPending, startTransition] = useTransition();
    const brandFormRef = useRef<HTMLFormElement>(null);
    const collectionFormRef = useRef<HTMLFormElement>(null);
    const categoryFormRef = useRef<HTMLFormElement>(null);

    // --- Manejadores para CREAR ---
    const handleCreateSubmit = (action: (formData: FormData) => Promise<{success: boolean; message?: string}>, formRef: React.RefObject<HTMLFormElement | null>, entityName: string) => (formData: FormData) => {
        startTransition(async () => {
            const result = await action(formData);
            if (result.success) {
                alert(`¡${entityName} creada!`);
                formRef.current?.reset();
            } else {
                alert(`Error: ${result.message}`);
            }
        });
    };

    // --- Manejadores para BORRAR ---
    const handleDelete = (action: (id: string) => Promise<{success: boolean; message?: string}>, id: string, entityName: string) => () => {
        if (!confirm(`¿Estás seguro de que quieres eliminar esta ${entityName.toLowerCase()}? Esta acción no se puede deshacer.`)) return;

        startTransition(async () => {
            const result = await action(id);
            if (result.success) {
                alert(`¡${entityName} eliminada!`);
            } else {
                alert(`Error: ${result.message}`);
            }
        });
    };
    
    // Estilos consistentes
    const formInputStyle = "block w-full rounded-lg border-0 py-1.5 px-3 text-gray-900 bg-white ring-1 ring-inset ring-gray-300 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6";
    const deleteButtonStyle = "text-gray-400 hover:text-red-600 disabled:text-gray-300 transition-colors";
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Columna de Marcas */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg ring-1 ring-gray-900/5">
                <h2 className="text-base font-semibold leading-7 text-gray-900">Marcas</h2>
                <form action={handleCreateSubmit(createBrandAction, brandFormRef, 'Marca')} ref={brandFormRef} className="mt-6 flex items-center gap-2">
                    <input type="text" name="name" required placeholder="Nueva marca" className={formInputStyle} />
                    <button type="submit" disabled={isPending} className="flex-shrink-0 rounded-md bg-indigo-600 p-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50">
                        <PlusIcon className="h-5 w-5"/>
                    </button>
                </form>
                <div className="mt-6 border-t border-gray-200 pt-6">
                    <h3 className="text-sm font-medium text-gray-500">Marcas Existentes</h3>
                    <ul className="mt-4 space-y-2 max-h-96 overflow-y-auto pr-2">
                        {initialBrands.map(brand => (
                            <li key={brand.id} className="flex items-center justify-between text-sm text-gray-800 p-3 bg-gray-50 rounded-lg">
                                <span>{brand.name}</span>
                                <button onClick={handleDelete(deleteBrandAction, brand.id, 'Marca')} disabled={isPending} className={deleteButtonStyle}>
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Columna de Colecciones */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg ring-1 ring-gray-900/5">
                <h2 className="text-base font-semibold leading-7 text-gray-900">Colecciones</h2>
                <form action={handleCreateSubmit(createCollectionAction, collectionFormRef, 'Colección')} ref={collectionFormRef} className="mt-6 space-y-4">
                    <input type="text" name="name" required placeholder="Nueva colección" className={formInputStyle} />
                    <select name="brand_id" required className={`${formInputStyle} disabled:bg-gray-100`} disabled={initialBrands.length === 0}>
                        <option value="">Asignar a una marca</option>
                        {initialBrands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                    </select>
                    <button type="submit" disabled={isPending || initialBrands.length === 0} className="w-full inline-flex justify-center items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50">
                        <PlusIcon className="h-5 w-5"/> Añadir Colección
                    </button>
                </form>
                <div className="mt-6 border-t border-gray-200 pt-6">
                    <h3 className="text-sm font-medium text-gray-500">Colecciones Existentes</h3>
                    <ul className="mt-4 space-y-2 max-h-80 overflow-y-auto pr-2">
                        {initialCollections.map(collection => (
                            <li key={collection.id} className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-lg">
                                <div className="flex flex-col">
                                    <span className="font-medium text-gray-800">{collection.name}</span>
                                    <span className="text-xs text-gray-500">{collection.brands?.name}</span>
                                </div>
                                <button onClick={handleDelete(deleteCollectionAction, collection.id, 'Colección')} disabled={isPending} className={deleteButtonStyle}>
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            
            {/* Columna de Categorías */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg ring-1 ring-gray-900/5">
                <h2 className="text-base font-semibold leading-7 text-gray-900">Categorías</h2>
                <form action={handleCreateSubmit(createCategoryAction, categoryFormRef, 'Categoría')} ref={categoryFormRef} className="mt-6 flex items-center gap-2">
                    <input type="text" name="name" required placeholder="Nueva categoría" className={formInputStyle} />
                    <button type="submit" disabled={isPending} className="flex-shrink-0 rounded-md bg-indigo-600 p-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50">
                        <PlusIcon className="h-5 w-5"/>
                    </button>
                </form>
                <div className="mt-6 border-t border-gray-200 pt-6">
                    <h3 className="text-sm font-medium text-gray-500">Categorías Existentes</h3>
                    <ul className="mt-4 space-y-2 max-h-96 overflow-y-auto pr-2">
                        {initialCategories.map(cat => (
                            <li key={cat.id} className="flex items-center justify-between text-sm text-gray-800 p-3 bg-gray-50 rounded-lg">
                                <span>{cat.name}</span>
                                <button onClick={handleDelete(deleteCategoryAction, cat.id, 'Categoría')} disabled={isPending} className={deleteButtonStyle}>
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}