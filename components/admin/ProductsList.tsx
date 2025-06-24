// components/admin/ProductsList.tsx
"use client";

import React, { useTransition } from 'react';
import type { ProductWithDetails } from '@/app/admin/products/page';
import { deleteProductAction } from '@/app/admin/products/actions';
import Link from 'next/link';

// --- Iconos para la UI ---
const PackageIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>;
const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>;

export function ProductsList({ products }: { products: ProductWithDetails[] }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = (productId: string, productName: string) => {
        if (confirm(`¿Estás seguro de que quieres eliminar el producto "${productName}"? Esta acción es permanente.`)) {
            startTransition(async () => {
                const result = await deleteProductAction(productId);
                if (result.success) {
                    alert(result.message);
                } else {
                    alert(`Error: ${result.message}`);
                }
            });
        }
    };

    if (products.length === 0) {
        return (
            <div className="text-center py-16 bg-white rounded-2xl shadow-lg ring-1 ring-gray-900/5">
                <PackageIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-semibold text-gray-900">No hay productos todavía</h3>
                <p className="mt-1 text-sm text-gray-500">Comienza por añadir tu primer producto al catálogo.</p>
                <div className="mt-6">
                    <Link href="/admin/products/new" className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                        <PlusIcon className="h-5 w-5"/>
                        Crear Producto
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg ring-1 ring-gray-900/5 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU Base</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marca</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {products.map((product) => (
                            <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{product.sku_base}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.collections?.brands?.name || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <Link href={`/admin/products/${product.id}/edit`} className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                                        Editar
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(product.id, product.name)}
                                        disabled={isPending}
                                        className="inline-flex items-center rounded-md bg-red-50 px-2.5 py-1.5 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-100 disabled:opacity-50"
                                    >
                                        {isPending ? "Eliminando..." : "Eliminar"}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
