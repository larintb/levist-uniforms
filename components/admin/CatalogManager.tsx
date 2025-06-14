// components/admin/CatalogManager.tsx
"use client";

import React, { useTransition, useRef } from 'react';
import { createBrandAction, createCollectionAction, createCategoryAction } from '@/app/(admin)/catalog/actions';

// Tipos de datos
type Brand = { id: string; name: string };
type Collection = { id: string; name: string; brands: { name: string | null } | null; };
type Category = { id: string; name: string }; // Añadido

interface CatalogManagerProps {
    initialBrands: Brand[];
    initialCollections: Collection[];
    initialCategories: Category[]; // Añadido
}

// Icono para los botones
const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>;

export function CatalogManager({ initialBrands, initialCollections, initialCategories }: CatalogManagerProps) {
    const [isPending, startTransition] = useTransition();
    const brandFormRef = useRef<HTMLFormElement>(null);
    const collectionFormRef = useRef<HTMLFormElement>(null);
    const categoryFormRef = useRef<HTMLFormElement>(null); // Añadido

    const handleBrandSubmit = (formData: FormData) => {
        startTransition(async () => {
            const result = await createBrandAction(formData);
            if (result.success) {
                alert('¡Marca creada!');
                brandFormRef.current?.reset();
            } else {
                alert(`Error: ${result.message}`);
            }
        });
    };
    
    const handleCollectionSubmit = (formData: FormData) => {
        startTransition(async () => {
            const result = await createCollectionAction(formData);
            if (result.success) {
                alert('¡Colección creada!');
                collectionFormRef.current?.reset();
            } else {
                alert(`Error: ${result.message}`);
            }
        });
    };

    const handleCategorySubmit = (formData: FormData) => { // Añadido
        startTransition(async () => {
            const result = await createCategoryAction(formData);
            if (result.success) {
                alert('¡Categoría creada!');
                categoryFormRef.current?.reset();
            } else {
                alert(`Error: ${result.message}`);
            }
        });
    };
    
    // Estilos consistentes para los elementos del formulario
    const formInputStyle = "block w-full rounded-lg border-0 py-1.5 px-3 text-gray-900 bg-white ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6";
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Columna de Marcas */}
            <div className="bg-white p-8 rounded-2xl shadow-lg ring-1 ring-gray-900/5">
                <h2 className="text-base font-semibold leading-7 text-gray-900">Marcas</h2>
                <form action={handleBrandSubmit} ref={brandFormRef} className="mt-6 flex items-center gap-2">
                    <input type="text" name="name" required placeholder="Nueva marca" className={formInputStyle} />
                    <button type="submit" disabled={isPending} className="flex-shrink-0 rounded-md bg-indigo-600 p-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:bg-indigo-400">
                        <PlusIcon className="h-5 w-5"/>
                    </button>
                </form>
                <div className="mt-6 border-t border-gray-200 pt-6">
                    <h3 className="text-sm font-medium text-gray-500">Marcas Existentes</h3>
                    <ul className="mt-4 space-y-3 max-h-96 overflow-y-auto pr-2">
                        {initialBrands.map(brand => <li key={brand.id} className="text-sm text-gray-800 p-3 bg-gray-50 rounded-lg">{brand.name}</li>)}
                    </ul>
                </div>
            </div>

            {/* Columna de Colecciones */}
            <div className="bg-white p-8 rounded-2xl shadow-lg ring-1 ring-gray-900/5">
                <h2 className="text-base font-semibold leading-7 text-gray-900">Colecciones</h2>
                <form action={handleCollectionSubmit} ref={collectionFormRef} className="mt-6 space-y-4">
                    <input type="text" name="name" required placeholder="Nueva colección" className={formInputStyle} />
                    <select name="brand_id" required className={`${formInputStyle} disabled:bg-gray-100`} disabled={initialBrands.length === 0}>
                        <option value="">Asignar a una marca</option>
                        {initialBrands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                    </select>
                    <button type="submit" disabled={isPending || initialBrands.length === 0} className="w-full inline-flex justify-center items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:bg-indigo-400">
                        <PlusIcon className="h-5 w-5"/> Añadir Colección
                    </button>
                </form>
                 <div className="mt-6 border-t border-gray-200 pt-6">
                    <h3 className="text-sm font-medium text-gray-500">Colecciones Existentes</h3>
                    <ul className="mt-4 space-y-3 max-h-80 overflow-y-auto pr-2">
                        {initialCollections.map(collection => (
                            <li key={collection.id} className="text-sm p-3 bg-gray-50 rounded-lg flex justify-between">
                                <span className="font-medium text-gray-800">{collection.name}</span>
                                <span className="text-xs text-white bg-gray-400 px-2 py-1 rounded-full">{collection.brands?.name}</span>
                            </li>
                        ))}
                    </ul>
                 </div>
            </div>
            
            {/* NUEVA Columna de Categorías */}
            <div className="bg-white p-8 rounded-2xl shadow-lg ring-1 ring-gray-900/5">
                <h2 className="text-base font-semibold leading-7 text-gray-900">Categorías</h2>
                <form action={handleCategorySubmit} ref={categoryFormRef} className="mt-6 flex items-center gap-2">
                    <input type="text" name="name" required placeholder="Nueva categoría" className={formInputStyle} />
                    <button type="submit" disabled={isPending} className="flex-shrink-0 rounded-md bg-indigo-600 p-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:bg-indigo-400">
                        <PlusIcon className="h-5 w-5"/>
                    </button>
                </form>
                <div className="mt-6 border-t border-gray-200 pt-6">
                    <h3 className="text-sm font-medium text-gray-500">Categorías Existentes</h3>
                    <ul className="mt-4 space-y-3 max-h-96 overflow-y-auto pr-2">
                        {initialCategories.map(cat => <li key={cat.id} className="text-sm text-gray-800 p-3 bg-gray-50 rounded-lg">{cat.name}</li>)}
                    </ul>
                </div>
            </div>
        </div>
    );
}
