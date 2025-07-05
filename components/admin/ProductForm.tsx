// Pega este código completo en tu archivo ProductForm.tsx

"use client";

import React, { useState, useTransition, useEffect } from 'react';
import Image from 'next/image';
import { createProductAction, updateProductAction } from '@/app/admin/products/actions';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

// --- Tipos ---
type Brand = { id: string; name: string; };
type Collection = { id: string; name: string; brand_id: string; };
type Category = { id: string; name: string; };

type InventoryRow = {
  id: string; 
  size: string;
  stock: number;
  price: number;
  barcode: string | null;
};

type Variant = {
  id: string; 
  color: string;
  image_url: string | null;
  inventory: InventoryRow[];
};

type InitialProductData = {
  id: string;
  name: string;
  sku_base: string;
  collection_id: string;
  category_id: string;
  product_variants: {
    id: string;
    color: string;
    image_url: string | null;
    inventory: {
        id: string;
        size: string;
        stock: number;
        price: number;
        barcode: string | null;
    }[];
  }[];
};

export interface ProductFormProps {
  brands: Brand[];
  collections: Collection[];
  categories: Category[];
  initialData?: InitialProductData;
}

// Este arreglo contiene todas las tallas únicas, estandarizadas y ordenadas lógicamente.
// Este arreglo contiene todas las tallas únicas, estandarizadas y ordenadas lógicamente.
const SIZES = [
  "XXS",
  "XXS PET",
  "XXS TAL",
  "XXS SHR",
  "2XS PET",
  "2XS SHR",
  "2XS TAL",
  "2XS",
  "XS PET",
  "XS SHR",
  "XS TAL",
  "XS",
  "S PET",
  "S SHR",
  "S TAL",
  "S",
  "S/M",
  "M PET",
  "M SHR",
  "M TAL",
  "M",
  "L PET",
  "L SHR",
  "L TAL",
  "L",
  "L/XL",
  "XL PET",
  "XL SHR",
  "XL TAL",
  "XL",
  "XXL",
  "XXL PET",
  "XXL SHR",
  "XXL TAL",
  "1X PET",
  "1X TAL",
  "1X",
  "2X PET",
  "2X SHR",
  "2X TAL",
  "2X",
  "2XL PET",
  "2XL SHR",
  "2XL TAL",
  "2XL",
  "3X PET",
  "3X SHR",
  "3X TAL",
  "3X",
  "3XL PET",
  "3XL SHR",
  "3XL TAL",
  "3XL",
  "4X",
  "4XL SHR",
  "4XL TAL",
  "4XL",
  "5X",
  "5XL SHR",
  "5XL TAL",
  "5XL",
  "OSFA",
  "28",
  "30",
  "32",
  "34",
  "36",
  "38",
  "40",
  "42",
  "44",
  "46",
  "48",
  "50",
  "52",
  "54",
  "56",
  "28 LG",
  "30 LG",
  "32 LG",
  "34 LG",
  "36 LG",
  "38 LG",
  "40 LG",
  "42 LG",
  "44 LG",
  "46 LG",
  "48 LG",
  "50 LG",
  "52 LG",
  "54 LG",
  "56 LG",
];

// --- Iconos ---
const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>;
const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.58.22-2.365.468a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193v-.443A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" /></svg>;
const ImageIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>;
const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>;


export function ProductForm({ brands, collections, categories, initialData }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedBrand, setSelectedBrand] = useState<string>(initialData?.collection_id ? collections.find(c => c.id === initialData.collection_id)?.brand_id || '' : '');
  const [variants, setVariants] = useState<Variant[]>(initialData?.product_variants || []);
  const [openVariantId, setOpenVariantId] = useState<string | null>(null);

  useEffect(() => {
    if (!initialData && variants.length === 0) {
      const newVariantId = `temp-${crypto.randomUUID()}`;
      setVariants([{ id: newVariantId, color: '', image_url: '', inventory: [] }]);
      setOpenVariantId(newVariantId);
    }
  }, [initialData, variants.length]);

  const availableCollections = collections.filter(c => c.brand_id === selectedBrand);

  const handleVariantFieldChange = (variantId: string, field: 'color' | 'image_url', value: string) => {
    setVariants(prev => prev.map(v => v.id === variantId ? { ...v, [field]: value } : v));
  };

  const handleAddVariant = () => {
    const newVariantId = `temp-${crypto.randomUUID()}`;
    setVariants([...variants, { id: newVariantId, color: '', image_url: null, inventory: [] }]);
    setOpenVariantId(newVariantId);
  };
  
  const handleRemoveVariant = (id: string) => setVariants(variants.filter(v => v.id !== id));
  
  const handleAddInventoryRow = (vId: string) => {
    setVariants(variants.map(v =>
      v.id === vId
        ? { ...v, inventory: [...v.inventory, { id: `temp-${crypto.randomUUID()}`, size: '', stock: 0, price: 0, barcode: null }] }
        : v
    ));
  };

  const handleInventoryChange = (variantId: string, inventoryId: string, field: keyof InventoryRow, value: string | number) => {
    setVariants(prev => prev.map(v => 
      v.id === variantId 
        ? { 
            ...v, 
            inventory: v.inventory.map(i => 
              i.id === inventoryId 
                ? { ...i, [field]: value } 
                : i
            ) 
          }
        : v
    ));
  };

  const handleRemoveInventoryRow = (vId: string, iId: string) => {
    setVariants(variants.map(v =>
      v.id === vId
        ? { ...v, inventory: v.inventory.filter(i => i.id !== iId) }
        : v
    ));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const variantsData = variants.map(variant => ({
        id: variant.id.startsWith('temp-') ? undefined : variant.id,
        color: variant.color,
        image_url: variant.image_url,
        inventory: variant.inventory.map(inv => ({
            id: inv.id.startsWith('temp-') ? undefined : inv.id,
            size: inv.size,
            stock: Number(inv.stock),
            price: Number(inv.price),
            barcode: inv.barcode,
        }))
    }));

    const finalFormData = new FormData();
    finalFormData.append('name', formData.get('name') as string);
    finalFormData.append('sku_base', formData.get('sku_base') as string);
    finalFormData.append('collection_id', formData.get('collection_id') as string);
    finalFormData.append('category_id', formData.get('category_id') as string);
    finalFormData.append('variants_json', JSON.stringify(variantsData));
    finalFormData.append('brand_id', selectedBrand);

    startTransition(async () => {
      const action = initialData ? updateProductAction.bind(null, initialData.id) : createProductAction;
      const result = await action(finalFormData);

      if (result.success) {
        toast.success(result.message);
        setTimeout(() => router.push('/admin/products'), 1500);
      } else {
        toast.error(`Error: ${result.message}`);
      }
    });
  };

  const formInputStyle = "block w-full rounded-lg border-0 py-1.5 px-3 text-gray-900 bg-white ring-1 ring-inset ring-gray-300 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6";
  const formLabelStyle = "block text-sm font-medium leading-6 text-gray-900";

  return (
    <form onSubmit={handleSubmit} className="space-y-12">
      <Toaster />
      <div className="bg-white p-8 rounded-2xl shadow-lg ring-1 ring-gray-900/5">
        <h2 className="text-base font-semibold leading-7 text-gray-900">Información del Producto</h2>
        <p className="mt-1 text-sm leading-6 text-gray-600">Datos generales que definen el producto base.</p>
        <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <label htmlFor="name" className={formLabelStyle}>Nombre del Producto</label>
            <div className="mt-2"><input type="text" name="name" id="name" required defaultValue={initialData?.name} className={formInputStyle}/></div>
          </div>
          <div className="sm:col-span-3">
            <label htmlFor="sku_base" className={formLabelStyle}>SKU Base</label>
            <div className="mt-2"><input type="text" name="sku_base" id="sku_base" required defaultValue={initialData?.sku_base} className={formInputStyle}/></div>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="brand_id" className={formLabelStyle}>Marca</label>
            <div className="mt-2"><select name="brand_id" id="brand_id" required value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className={formInputStyle}><option value="">Selecciona</option>{brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="collection_id" className={formLabelStyle}>Colección</label>
            <div className="mt-2"><select name="collection_id" id="collection_id" required defaultValue={initialData?.collection_id} disabled={!selectedBrand} className={`${formInputStyle} disabled:bg-gray-100 disabled:cursor-not-allowed`}><option value="">Selecciona</option>{availableCollections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="category_id" className={formLabelStyle}>Categoría</label>
            <div className="mt-2"><select name="category_id" id="category_id" required defaultValue={initialData?.category_id} className={formInputStyle}><option value="">Selecciona</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-lg ring-1 ring-gray-900/5">
        <h2 className="text-base font-semibold leading-7 text-gray-900">Variantes e Inventario</h2>
        <div className="space-y-4 mt-10">
          {variants.map((variant, vIndex) => (
            <div key={variant.id} className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setOpenVariantId(openVariantId === variant.id ? null : variant.id)}
              >
                <div className="flex items-center gap-3">
                  {variant.image_url ? (
                    <Image src={variant.image_url} alt={variant.color} width={40} height={40} className="h-10 w-10 rounded-md object-cover bg-gray-100" onError={(e) => { const target = e.currentTarget as HTMLImageElement; target.src = 'https://placehold.co/40x40/f8f9fa/e9ecef?text=?'; }}/>
                  ) : (
                    <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-gray-300" />
                    </div>
                  )}
                  <h3 className="font-semibold text-gray-800">
                    {variant.color || `Variante de Color #${vIndex + 1}`}
                  </h3>
                </div>
                <div className="flex items-center gap-4">
                  {variants.length > 1 && 
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); handleRemoveVariant(variant.id); }} 
                      className="text-red-600 hover:text-red-800 text-sm font-medium inline-flex items-center gap-1 z-10"
                    > 
                      <TrashIcon className="h-4 w-4"/> 
                      <span className="hidden sm:inline">Eliminar</span>
                    </button>
                  }
                  <ChevronDownIcon className={`h-6 w-6 text-gray-500 transition-transform ${openVariantId === variant.id ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {openVariantId === variant.id && (
                <div className="p-6 pt-2">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-6">
                    <div className="lg:col-span-1">
                        <label className={`${formLabelStyle} mb-2`}>Vista Previa</label>
                        <div className="mt-2 flex justify-center items-center h-40 w-full rounded-lg border border-dashed border-gray-900/25 bg-gray-50 p-2">
                            {variant.image_url ? ( 
                              <Image 
                              src={variant.image_url} 
                              alt={`Vista previa de ${variant.color}`} 
                              width={150} 
                              height={150} 
                              className="h-full w-full object-contain rounded-md" 
                              onError={(e) => { const target = e.currentTarget as HTMLImageElement; target.src = 'https://placehold.co/150x150/f8f9fa/e9ecef?text=Error'; }} /> ) : ( <div className="text-center"> <ImageIcon className="mx-auto h-12 w-12 text-gray-300" /> <p className="mt-2 text-xs leading-5 text-gray-600">Sin imagen</p> </div> )}
                        </div>
                    </div>
                    <div className="lg:col-span-2 space-y-6">
                        <div>
                            <label htmlFor={`color-${variant.id}`} className={formLabelStyle}>Color</label>
                            <div className="mt-2"><input type="text" id={`color-${variant.id}`} value={variant.color} onChange={(e) => handleVariantFieldChange(variant.id, 'color', e.target.value)} required placeholder="Ej: Royal Blue" className={formInputStyle}/></div>
                        </div>
                        <div>
                            <label htmlFor={`image_url-${variant.id}`} className={formLabelStyle}>URL de la Imagen</label>
                            <div className="mt-2"><input type="url" id={`image_url-${variant.id}`} value={variant.image_url ?? ''} onChange={(e) => handleVariantFieldChange(variant.id, 'image_url', e.target.value)} placeholder="https://..." className={formInputStyle}/></div>
                        </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <h4 className="text-sm font-medium text-gray-800 mb-4">Inventario de esta Variante</h4>
                    <div className="grid grid-cols-12 gap-x-4 mb-2 px-2 text-xs font-medium text-gray-500 max-sm:hidden">
                      <div className="col-span-3">Talla</div>
                      <div className="col-span-4">Código de Barras</div>
                      <div className="col-span-2">Stock</div>
                      <div className="col-span-2">Precio ($)</div>
                      <div className="col-span-1"></div>
                    </div>
                    <div className="space-y-4">
                      {variant.inventory.map(inv => (
                        <div key={inv.id} className="grid grid-cols-12 gap-x-4 gap-y-2 items-center">
                          <div className="col-span-12 sm:col-span-3">
                            <label className="sm:hidden text-xs font-medium text-gray-500">Talla</label>
                            <select 
                                value={inv.size} 
                                onChange={(e) => handleInventoryChange(variant.id, inv.id, 'size', e.target.value)}
                                className={formInputStyle}
                            >
                                <option value="">Talla</option>{SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div className="col-span-12 sm:col-span-4">
                                <label className="sm:hidden text-xs font-medium text-gray-500">Código de Barras</label>
                                <input 
                                    type="text" 
                                    placeholder="Escanear o escribir código" 
                                    value={inv.barcode ?? ''} 
                                    onChange={(e) => handleInventoryChange(variant.id, inv.id, 'barcode', e.target.value)}
                                    className={formInputStyle} 
                                    onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} 
                                />
                          </div>
                          <div className="col-span-6 sm:col-span-2">
                            <label className="sm:hidden text-xs font-medium text-gray-500">Stock</label>
                            <input 
                                type="number" 
                                placeholder="0" 
                                value={inv.stock} 
                                onChange={(e) => handleInventoryChange(variant.id, inv.id, 'stock', Number(e.target.value))}
                                className={formInputStyle} 
                            />
                          </div>
                          <div className="col-span-6 sm:col-span-2">
                            <label className="sm:hidden text-xs font-medium text-gray-500">Precio</label>
                            <input 
                                type="number" 
                                step="0.01" 
                                placeholder="0.00" 
                                value={inv.price} 
                                onChange={(e) => handleInventoryChange(variant.id, inv.id, 'price', Number(e.target.value))}
                                className={formInputStyle} 
                            />
                          </div>
                          <div className="col-span-12 sm:col-span-1 flex justify-end">
                            <button type="button" onClick={() => handleRemoveInventoryRow(variant.id, inv.id)} className="text-gray-500 p-2 rounded-full hover:bg-gray-100 hover:text-red-600">
                              <TrashIcon className="h-5 w-5"/>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={() => handleAddInventoryRow(variant.id)} className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                      <PlusIcon className="h-5 w-5"/>Añadir Talla
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={handleAddVariant} className="mt-8 inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-100">
          <PlusIcon className="h-5 w-5"/>Añadir Variante
        </button>
      </div>

      <div className="mt-6 flex items-center justify-end gap-x-6">
        <button type="button" onClick={() => router.back()} disabled={isPending} className="text-sm font-semibold leading-6 text-gray-900">Cancelar</button>
        <button type="submit" disabled={isPending} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:bg-indigo-400">
          {isPending ? "Guardando..." : (initialData ? "Actualizar Producto" : "Crear Producto")}
        </button>
      </div>
    </form>
  );
}