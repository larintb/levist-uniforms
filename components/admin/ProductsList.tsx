"use client";

import React, { useState, useEffect, useMemo, useCallback, useTransition } from 'react';
import type { ProductWithDetails } from '@/app/admin/products/page';
import { createClient } from '@/lib/supabase/client';
import { deleteProductAction } from '@/app/admin/products/actions';
import Link from 'next/link';
import { Plus, ChevronUp, ChevronDown, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, Package, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function SortIcon({ direction }: { direction: 'ascending' | 'descending' | null }) {
  if (!direction) return null;
  return direction === 'ascending' ? <ChevronUp size={13} className="inline ml-1" /> : <ChevronDown size={13} className="inline ml-1" />;
}

function ConfirmDeleteModal({ open, isPending, productName, onClose, onConfirm }: {
  open: boolean; isPending: boolean; productName?: string; onClose: () => void; onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Confirmar Eliminación</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          ¿Eliminar el producto <span className="font-semibold text-foreground">&quot;{productName}&quot;</span>? Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancelar</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
    setLoading(true); setError(null);
    try {
      let brandCollectionIds: string[] = [];
      if (searchTerm) {
        const { data: matchingBrands } = await supabase.from('brands').select('id').ilike('name', `%${searchTerm}%`);
        if (matchingBrands?.length) {
          const { data: matchingCollections } = await supabase.from('collections').select('id').in('brand_id', matchingBrands.map(b => b.id));
          brandCollectionIds = matchingCollections?.map(c => c.id) ?? [];
        }
      }
      let query = supabase.from('products').select(`id, name, sku_base, collections ( name, brands ( name ) )`, { count: 'exact' });
      if (searchTerm) {
        const orParts = [`name.ilike.%${searchTerm}%`, `sku_base.ilike.%${searchTerm}%`];
        if (brandCollectionIds.length > 0) orParts.push(`collection_id.in.(${brandCollectionIds.join(',')})`);
        query = query.or(orParts.join(','));
      }
      if (sortConfig?.key !== 'brand_name') query = query.order(sortConfig!.key, { ascending: sortConfig!.direction === 'ascending' });
      const startIndex = (currentPage - 1) * itemsPerPage;
      query = query.range(startIndex, startIndex + itemsPerPage - 1);
      const { data: rawData, error: fetchError, count } = await query;
      if (fetchError) throw fetchError;
      const transformed: ProductWithDetails[] = (rawData || []).map(product => {
        const collection = Array.isArray(product.collections) ? product.collections[0] : product.collections;
        const brand = collection && Array.isArray(collection.brands) ? collection.brands[0] : collection?.brands;
        return { id: product.id, name: product.name, sku_base: product.sku_base, collection_name: collection?.name || null, brand_name: Array.isArray(brand) ? (brand[0]?.name ?? null) : (brand?.name ?? null) };
      });
      setProducts(transformed); setTotalProducts(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [supabase, searchTerm, sortConfig, currentPage, itemsPerPage]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const totalPages = Math.ceil(totalProducts / itemsPerPage);
  const activeBrandsCount = useMemo(() => [...new Set(products.map(p => p.brand_name).filter(Boolean))].length, [products]);

  const requestSort = useCallback((key: keyof ProductWithDetails) => {
    setSortConfig(prev => ({ key, direction: prev?.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending' }));
    setCurrentPage(1);
  }, []);

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const tableHeaders: { key: keyof ProductWithDetails; label: string; sortable: boolean; className?: string }[] = [
    { key: 'name', label: 'Producto', sortable: true },
    { key: 'sku_base', label: 'SKU Base', sortable: true },
    { key: 'brand_name', label: 'Marca', sortable: true },
    { key: 'id', label: '', sortable: false, className: 'w-32 text-right' },
  ];

  return (
    <>
      <ConfirmDeleteModal
        open={modal.open} isPending={isPendingDelete} productName={modal.productName}
        onClose={() => setModal({ open: false })}
        onConfirm={() => {
          if (!modal.productId) return;
          startTransition(async () => {
            await deleteProductAction(modal.productId!);
            setModal({ open: false });
            await fetchProducts();
          });
        }}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Productos</CardTitle>
            <Package size={14} className="text-muted-foreground/60" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {loading ? <Skeleton className="h-7 w-16 mt-1" /> : <p className="text-2xl font-semibold font-mono tabular-nums">{totalProducts}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Marcas Activas</CardTitle>
            <Tag size={14} className="text-muted-foreground/60" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {loading ? <Skeleton className="h-7 w-10 mt-1" /> : <p className="text-2xl font-semibold font-mono tabular-nums">{activeBrandsCount}</p>}
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="px-4 pt-4 pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Listado de Productos</CardTitle>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Buscar producto, SKU, marca…"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="h-8 w-56 text-sm"
            />
            <Button asChild size="sm">
              <Link href="/admin/products/new"><Plus size={14} /> Crear</Link>
            </Button>
          </div>
        </CardHeader>

        <div className="border-t border-border">
          {loading ? (
            <div className="p-4 space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
          ) : error ? (
            <p className="text-center text-destructive text-sm py-8">{error}</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      {tableHeaders.map(h => (
                        <TableHead
                          key={h.key}
                          className={cn("h-9 text-xs", h.className, h.sortable && "cursor-pointer select-none hover:text-foreground")}
                          onClick={() => h.sortable && requestSort(h.key)}
                        >
                          {h.label}<SortIcon direction={sortConfig?.key === h.key ? sortConfig.direction : null} />
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.length > 0 ? products.map(product => (
                      <TableRow key={product.id} className="h-10">
                        <TableCell className="py-1.5 text-sm font-medium">{product.name}</TableCell>
                        <TableCell className="py-1.5 text-xs font-mono text-muted-foreground">{product.sku_base}</TableCell>
                        <TableCell className="py-1.5 text-sm text-muted-foreground">{product.brand_name || '—'}</TableCell>
                        <TableCell className="py-1.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="xs" asChild>
                              <Link href={`/admin/products/${product.id}/edit`}>Editar</Link>
                            </Button>
                            <Button
                              variant="ghost" size="xs"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setModal({ open: true, productId: product.id, productName: product.name })}
                              disabled={isPendingDelete}
                            >
                              Eliminar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground text-sm py-8">
                          No se encontraron productos.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <div className="flex items-center gap-3">
                  <p className="text-xs text-muted-foreground">
                    {totalProducts > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}–{Math.min(currentPage * itemsPerPage, totalProducts)} de {totalProducts}
                  </p>
                  <Select value={String(itemsPerPage)} onValueChange={v => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                    <SelectTrigger className="h-7 w-[72px] text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[10, 25, 50].map(n => <SelectItem key={n} value={String(n)} className="text-xs">{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon-xs" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronsLeft size={13} /></Button>
                  <Button variant="outline" size="icon-xs" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft size={13} /></Button>
                  <span className="text-xs text-muted-foreground px-2 tabular-nums">{currentPage} / {totalPages || 1}</span>
                  <Button variant="outline" size="icon-xs" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}><ChevronRight size={13} /></Button>
                  <Button variant="outline" size="icon-xs" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0}><ChevronsRight size={13} /></Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
    </>
  );
}
