// app/admin/dashboard/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image'; // Importamos el componente Image

// El tipo ahora incluye la URL de la imagen y el ID del producto
type InventoryItem = {
  inventory_id: string; product_id: string; product_name: string;
  color: string; sku: string; size: string; stock: number; price: number;
  brand: string; collection: string; category: string;
  image_url: string | null; // Añadido
};

// --- Iconos ---
const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
);
// Icono para cuando no hay imagen
const ImageIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
);


const StatCard = ({ title, value, color }: { title: string, value: number | string, color: string }) => (
  <div className="bg-white p-6 rounded-lg shadow-md border-l-4" style={{ borderColor: color }}>
    <h3 className="text-sm font-medium text-gray-500">{title}</h3>
    <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
  </div>
);

export default function AdminDashboardPage() {
  const supabase = createClient();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.from('full_inventory_details').select('*').order('product_name', { ascending: true });
        if (error) throw error;
        setInventory(data || []);
      } catch (err: any) {
        setError('No se pudo cargar el inventario.');
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, [supabase]);

  const filteredInventory = inventory.filter(item =>
    item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const lowStockCount = inventory.filter(i => i.stock > 0 && i.stock < 5).length;
  const outOfStockCount = inventory.filter(i => i.stock === 0).length;
  const activeBrandsCount = [...new Set(inventory.map(i => i.brand))].length;

  return (
    <div className="p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-lg text-gray-600">Resumen general de tu tienda.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total de SKUs" value={inventory.length} color="#3B82F6" />
          <StatCard title="Stock Bajo (<5)" value={lowStockCount} color="#F59E0B" />
          <StatCard title="Agotados" value={outOfStockCount} color="#EF4444" />
          <StatCard title="Marcas Activas" value={activeBrandsCount} color="#10B981" />
      </div>

      <main className="bg-white p-6 md:p-8 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 md:mb-0">Inventario Actual</h2>
          <div className="w-full md:w-auto flex items-center gap-4">
            <input
              type="text"
              placeholder="Buscar por producto"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-32 py-4 text-lg bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-gray-600"
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Imagen</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Talla</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.map((item) => (
                  <tr key={item.inventory_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex-shrink-0 h-10 w-10">
                            {item.image_url ? (
                                <Image
                                    src={item.image_url}
                                    alt={item.product_name}
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
                       <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.stock === 0 ? 'bg-red-100 text-red-800' : item.stock < 5 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                         {item.stock}
                       </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right text-gray-500">${item.price.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      {/* CORRECCIÓN: El enlace ahora usa el `product_id` para ir a la página de edición correcta. */}
                      <Link href={`/admin/products/${item.product_id}/edit`} className="text-indigo-600 hover:text-indigo-900">
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
