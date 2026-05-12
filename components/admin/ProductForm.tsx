"use client";

import React, { useState, useTransition, useEffect } from 'react';
import Image from 'next/image';
import { createProductAction, updateProductAction } from '@/app/admin/products/actions';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Plus, Trash2, ImageOff, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// --- Types ---
type Brand = { id: string; name: string };
type Collection = { id: string; name: string; brand_id: string };
type Category = { id: string; name: string };

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

const SIZES = [
  "XXS","XXS PET","XXS TAL","XXS SHR","2XS PET","2XS SHR","2XS TAL","2XS",
  "XS PET","XS SHR","XS TAL","XS","S PET","S SHR","S TAL","S","S/M",
  "M PET","M SHR","M TAL","M","L PET","L SHR","L TAL","L","L/XL",
  "XL PET","XL SHR","XL TAL","XL","XXL","XXL PET","XXL SHR","XXL TAL",
  "1X PET","1X TAL","1X","2X PET","2X SHR","2X TAL","2X",
  "2XL PET","2XL SHR","2XL TAL","2XL","3X PET","3X SHR","3X TAL","3X",
  "3XL PET","3XL SHR","3XL TAL","3XL","4X","4XL SHR","4XL TAL","4XL",
  "5X","5XL SHR","5XL TAL","5XL","OSFA",
  "4","6","8","10","12","14","16","18","20","22","23","23.5","24","24.5",
  "25","25.5","26","26.5","27","27.5","28","28.5","29","29.5","30",
  "32","34","36","38","40","42","44","46","48","50","52","54","56",
  "28 LG","30 LG","32 LG","34 LG","36 LG","38 LG","40 LG","42 LG",
  "44 LG","46 LG","48 LG","50 LG","52 LG","54 LG","56 LG","R","X",
];

// Shared select className (native <select> stays native for large lists)
const selectCls = cn(
  "flex h-8 w-full rounded-md border border-input bg-background px-3 py-0 text-sm",
  "text-foreground ring-offset-background placeholder:text-muted-foreground",
  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  "disabled:cursor-not-allowed disabled:opacity-50"
);

export function ProductForm({ brands, collections, categories, initialData }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedBrand, setSelectedBrand] = useState<string>(
    initialData?.collection_id
      ? (collections.find(c => c.id === initialData.collection_id)?.brand_id ?? '')
      : ''
  );
  const [variants, setVariants] = useState<Variant[]>(initialData?.product_variants ?? []);
  const [openVariantId, setOpenVariantId] = useState<string | null>(null);

  useEffect(() => {
    if (!initialData && variants.length === 0) {
      const id = `temp-${crypto.randomUUID()}`;
      setVariants([{ id, color: '', image_url: '', inventory: [] }]);
      setOpenVariantId(id);
    }
  }, [initialData, variants.length]);

  const availableCollections = collections.filter(c => c.brand_id === selectedBrand);

  const handleVariantField = (variantId: string, field: 'color' | 'image_url', value: string) =>
    setVariants(prev => prev.map(v => v.id === variantId ? { ...v, [field]: value } : v));

  const handleAddVariant = () => {
    const id = `temp-${crypto.randomUUID()}`;
    setVariants(prev => [...prev, { id, color: '', image_url: null, inventory: [] }]);
    setOpenVariantId(id);
  };

  const handleRemoveVariant = (id: string) =>
    setVariants(prev => prev.filter(v => v.id !== id));

  const handleAddInventoryRow = (vId: string) =>
    setVariants(prev => prev.map(v =>
      v.id === vId
        ? { ...v, inventory: [...v.inventory, { id: `temp-${crypto.randomUUID()}`, size: '', stock: 0, price: 0, barcode: null }] }
        : v
    ));

  const handleInventoryChange = (variantId: string, invId: string, field: keyof InventoryRow, value: string | number) =>
    setVariants(prev => prev.map(v =>
      v.id === variantId
        ? { ...v, inventory: v.inventory.map(i => i.id === invId ? { ...i, [field]: value } : i) }
        : v
    ));

  const handleRemoveInventoryRow = (vId: string, iId: string) =>
    setVariants(prev => prev.map(v =>
      v.id === vId ? { ...v, inventory: v.inventory.filter(i => i.id !== iId) } : v
    ));

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const variantsData = variants.map(v => ({
      id: v.id.startsWith('temp-') ? undefined : v.id,
      color: v.color,
      image_url: v.image_url,
      inventory: v.inventory.map(i => ({
        id: i.id.startsWith('temp-') ? undefined : i.id,
        size: i.size,
        stock: Number(i.stock),
        price: Number(i.price),
        barcode: i.barcode,
      })),
    }));

    const payload = new FormData();
    payload.append('name', formData.get('name') as string);
    payload.append('sku_base', formData.get('sku_base') as string);
    payload.append('collection_id', formData.get('collection_id') as string);
    payload.append('category_id', formData.get('category_id') as string);
    payload.append('variants_json', JSON.stringify(variantsData));
    payload.append('brand_id', selectedBrand);

    startTransition(async () => {
      const action = initialData ? updateProductAction.bind(null, initialData.id) : createProductAction;
      const result = await action(payload);
      if (result.success) {
        toast.success(result.message);
        setTimeout(() => router.push('/admin/products'), 1500);
      } else {
        toast.error(`Error: ${result.message}`);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Section 1: Base info */}
      <Card>
        <CardHeader className="px-6 pt-5 pb-0">
          <CardTitle className="text-sm font-semibold">Información del Producto</CardTitle>
          <CardDescription className="text-xs">Datos generales que definen el producto base.</CardDescription>
        </CardHeader>
        <CardContent className="px-6 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
            <div className="sm:col-span-3 space-y-1.5">
              <Label htmlFor="name" className="text-xs font-medium">Nombre del Producto <span className="text-destructive">*</span></Label>
              <Input id="name" name="name" required defaultValue={initialData?.name} className="h-8 text-sm" />
            </div>
            <div className="sm:col-span-3 space-y-1.5">
              <Label htmlFor="sku_base" className="text-xs font-medium">SKU Base <span className="text-destructive">*</span></Label>
              <Input id="sku_base" name="sku_base" required defaultValue={initialData?.sku_base} className="h-8 text-sm font-mono" />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="brand_id" className="text-xs font-medium">Marca <span className="text-destructive">*</span></Label>
              <select
                name="brand_id"
                id="brand_id"
                required
                value={selectedBrand}
                onChange={e => setSelectedBrand(e.target.value)}
                className={selectCls}
              >
                <option value="">Selecciona marca</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="collection_id" className="text-xs font-medium">Colección <span className="text-destructive">*</span></Label>
              <select
                name="collection_id"
                id="collection_id"
                required
                defaultValue={initialData?.collection_id}
                disabled={!selectedBrand}
                className={cn(selectCls, "disabled:opacity-50 disabled:cursor-not-allowed")}
              >
                <option value="">Selecciona colección</option>
                {availableCollections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="category_id" className="text-xs font-medium">Categoría <span className="text-destructive">*</span></Label>
              <select
                name="category_id"
                id="category_id"
                required
                defaultValue={initialData?.category_id}
                className={selectCls}
              >
                <option value="">Selecciona categoría</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Variants */}
      <Card>
        <CardHeader className="px-6 pt-5 pb-0">
          <CardTitle className="text-sm font-semibold">Variantes e Inventario</CardTitle>
          <CardDescription className="text-xs">Cada variante representa un color con sus tallas y existencias.</CardDescription>
        </CardHeader>
        <CardContent className="px-6 py-5 space-y-3">
          {variants.map((variant, vIndex) => {
            const isOpen = openVariantId === variant.id;
            return (
              <div key={variant.id} className="border border-border rounded-lg overflow-hidden">
                {/* Variant header */}
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors text-left"
                  onClick={() => setOpenVariantId(isOpen ? null : variant.id)}
                >
                  <div className="flex items-center gap-3">
                    {variant.image_url ? (
                      <Image
                        src={variant.image_url}
                        alt={variant.color}
                        width={32}
                        height={32}
                        className="size-8 rounded-md object-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = ''; }}
                      />
                    ) : (
                      <div className="size-8 rounded-md bg-muted flex items-center justify-center">
                        <ImageOff size={14} className="text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {variant.color || `Variante #${vIndex + 1}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {variant.inventory.length} talla{variant.inventory.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {variants.length > 1 && (
                      <span
                        role="button"
                        onClick={(e) => { e.stopPropagation(); handleRemoveVariant(variant.id); }}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded hover:bg-destructive/10"
                      >
                        <Trash2 size={12} /> Eliminar
                      </span>
                    )}
                    <ChevronDown
                      size={16}
                      className={cn("text-muted-foreground transition-transform shrink-0", isOpen && "rotate-180")}
                    />
                  </div>
                </button>

                {/* Variant body */}
                {isOpen && (
                  <div className="px-4 pb-5 pt-1 border-t border-border bg-muted/20">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
                      {/* Image preview */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Vista previa</Label>
                        <div className="flex items-center justify-center h-36 rounded-lg border border-dashed border-border bg-background">
                          {variant.image_url ? (
                            <Image
                              src={variant.image_url}
                              alt={`Vista previa ${variant.color}`}
                              width={120}
                              height={120}
                              className="h-full w-full object-contain rounded-lg p-1"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).src = ''; }}
                            />
                          ) : (
                            <div className="text-center text-muted-foreground">
                              <ImageOff size={28} className="mx-auto mb-1.5" />
                              <p className="text-xs">Sin imagen</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Color + URL */}
                      <div className="lg:col-span-2 space-y-4">
                        <div className="space-y-1.5">
                          <Label htmlFor={`color-${variant.id}`} className="text-xs font-medium">Color <span className="text-destructive">*</span></Label>
                          <Input
                            id={`color-${variant.id}`}
                            value={variant.color}
                            onChange={e => handleVariantField(variant.id, 'color', e.target.value)}
                            required
                            placeholder="Ej: Royal Blue"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`image_url-${variant.id}`} className="text-xs font-medium">URL de Imagen</Label>
                          <Input
                            id={`image_url-${variant.id}`}
                            type="url"
                            value={variant.image_url ?? ''}
                            onChange={e => handleVariantField(variant.id, 'image_url', e.target.value)}
                            placeholder="https://…"
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Inventory table */}
                    <Separator className="my-4" />
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Inventario</p>

                      {/* Header row */}
                      {variant.inventory.length > 0 && (
                        <div className="hidden sm:grid grid-cols-12 gap-2 px-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                          <div className="col-span-3">Talla</div>
                          <div className="col-span-4">Código de barras</div>
                          <div className="col-span-2">Stock</div>
                          <div className="col-span-2">Precio ($)</div>
                          <div className="col-span-1" />
                        </div>
                      )}

                      {[...variant.inventory]
                        .sort((a, b) => {
                          const ai = SIZES.indexOf(a.size), bi = SIZES.indexOf(b.size);
                          if (ai === -1 && bi === -1) return 0;
                          if (ai === -1) return 1;
                          if (bi === -1) return -1;
                          return ai - bi;
                        })
                        .map(inv => (
                          <div key={inv.id} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-12 sm:col-span-3">
                              <label className="sm:hidden text-[10px] text-muted-foreground mb-0.5 block">Talla</label>
                              <select
                                value={inv.size}
                                onChange={e => handleInventoryChange(variant.id, inv.id, 'size', e.target.value)}
                                className={selectCls}
                              >
                                <option value="">Talla</option>
                                {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                            <div className="col-span-12 sm:col-span-4">
                              <label className="sm:hidden text-[10px] text-muted-foreground mb-0.5 block">Código de barras</label>
                              <Input
                                type="text"
                                placeholder="Escanear o escribir"
                                value={inv.barcode ?? ''}
                                onChange={e => handleInventoryChange(variant.id, inv.id, 'barcode', e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                                className="h-8 text-sm font-mono"
                              />
                            </div>
                            <div className="col-span-6 sm:col-span-2">
                              <label className="sm:hidden text-[10px] text-muted-foreground mb-0.5 block">Stock</label>
                              <Input
                                type="number"
                                placeholder="0"
                                value={inv.stock}
                                onChange={e => handleInventoryChange(variant.id, inv.id, 'stock', Number(e.target.value))}
                                className="h-8 text-sm font-mono tabular-nums"
                              />
                            </div>
                            <div className="col-span-6 sm:col-span-2">
                              <label className="sm:hidden text-[10px] text-muted-foreground mb-0.5 block">Precio</label>
                              <Input
                                type="number"
                                step="1"
                                placeholder="0"
                                value={inv.price}
                                onChange={e => handleInventoryChange(variant.id, inv.id, 'price', Number(e.target.value))}
                                className="h-8 text-sm font-mono tabular-nums"
                              />
                            </div>
                            <div className="col-span-12 sm:col-span-1 flex justify-end">
                              <button
                                type="button"
                                onClick={() => handleRemoveInventoryRow(variant.id, inv.id)}
                                className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddInventoryRow(variant.id)}
                        className="mt-1"
                      >
                        <Plus size={14} /> Añadir Talla
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddVariant}
            className="w-full border-dashed"
          >
            <Plus size={14} /> Añadir Variante de Color
          </Button>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pb-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => router.back()} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending} size="sm">
          {isPending ? "Guardando…" : initialData ? "Actualizar Producto" : "Crear Producto"}
        </Button>
      </div>
    </form>
  );
}
