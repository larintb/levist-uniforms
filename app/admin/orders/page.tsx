// @/app/admin/orders/page.tsx
"use client";

import React, { useState, useEffect, useTransition, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { updateItemDeliveryStatus, updateAllItemsDeliveryStatus } from './actions';
import { updateOrderMultipleStatuses } from './multiple-status-actions';
import { MultiCopyPrintButton } from '@/components/admin/MultiCopyPrintButton';
import { getSchools } from '@/app/admin/pos/actions';
import { Search, X, ArrowUpDown, ArrowDown, ArrowUp, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type School = { id: string; name: string };
type OrderItem = {
  item_id: string; product_name: string; sku: string; color: string; size: string;
  quantity: number; price_at_sale: number; delivered: boolean;
};
type Order = {
  id: string; created_at: string; customer_name: string | null; customer_phone: string | null;
  total: number; subtotal: number; discount_amount: number; discount_reason: string | null;
  status: string; active_statuses: string[]; seller_name: string | null;
  payment_method: string | null; embroidery_notes: string | null; requires_invoice: boolean;
  school_name: string | null; is_layaway: boolean; down_payment: number;
  remaining_balance: number; encargo_id: string | null; items: OrderItem[];
};
type OrderViewRow = {
  order_id: string; order_date: string; order_total: number; order_status: string;
  active_statuses: string[]; subtotal: number; discount_amount: number;
  discount_reason: string | null; customer_name: string | null; customer_phone: string | null;
  seller_name: string | null; payment_method: string | null; embroidery_notes: string | null;
  requires_invoice: boolean; school_name: string | null; is_layaway: boolean;
  down_payment: number; remaining_balance: number; encargo_id: string | null;
  item_id: string; product_name: string; sku: string; color: string; size: string;
  quantity: number; price_at_sale: number; delivered: boolean;
};

const statusInfo: Record<string, { label: string; className: string }> = {
  COMPLETED: { label: 'Completado', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800' },
  PENDING_EMBROIDERY: { label: 'Bordado', className: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:text-amber-400 dark:border-amber-800' },
  PENDING_SUPPLIER: { label: 'Proveedor', className: 'bg-sky-500/10 text-sky-600 border-sky-200 dark:text-sky-400 dark:border-sky-800' },
  PENDING_PAYMENT: { label: 'Pago Pend.', className: 'bg-orange-500/10 text-orange-600 border-orange-200 dark:text-orange-400 dark:border-orange-800' },
  READY_FOR_PICKUP: { label: 'Listo', className: 'bg-violet-500/10 text-violet-600 border-violet-200 dark:text-violet-400 dark:border-violet-800' },
  DELIVERED: { label: 'Entregado', className: 'bg-muted text-muted-foreground border-border' },
  LAYAWAY: { label: 'Separado', className: 'bg-purple-500/10 text-purple-600 border-purple-200 dark:text-purple-400 dark:border-purple-800' },
};

const StatusBadge = ({ status }: { status: string | null }) => {
  const s = statusInfo[status ?? ''] ?? { label: status ?? 'N/A', className: 'bg-muted text-muted-foreground border-border' };
  return <Badge variant="outline" className={cn('text-[10px] font-medium px-1.5', s.className)}>{s.label}</Badge>;
};

const MultiStatusBadges = ({ statuses }: { statuses: string[] }) => {
  if (!statuses?.length) return <StatusBadge status="N/A" />;
  return <div className="flex flex-col gap-1">{statuses.map((s, i) => <StatusBadge key={`${s}-${i}`} status={s} />)}</div>;
};

const HighlightedText = ({ text, searchTerm }: { text: string; searchTerm: string }) => {
  if (!searchTerm.trim()) return <>{text}</>;
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return <>{parts.map((part, i) => regex.test(part) ? <span key={i} className="bg-amber-200 dark:bg-amber-800 font-medium">{part}</span> : part)}</>;
};

// ─────────────────────────────────────────────────────────────
// Order List Column
// ─────────────────────────────────────────────────────────────
const OrderListColumn = ({
  orders, selectedOrder, setSelectedOrder, setFilter, setSortOrder,
  setDateFilter, setSchoolFilter, setCustomerSearchFilter, schools,
}: {
  orders: Order[]; selectedOrder: Order | null; setSelectedOrder: (o: Order) => void;
  setFilter: (s: string) => void; setSortOrder: (o: 'asc' | 'desc') => void;
  setDateFilter: (f: string) => void; setSchoolFilter: (id: string) => void;
  setCustomerSearchFilter: (s: string) => void; schools: School[];
}) => {
  const statuses = ['ALL', 'PENDING_PAYMENT', 'READY_FOR_PICKUP', 'PENDING_EMBROIDERY', 'PENDING_SUPPLIER', 'LAYAWAY', 'COMPLETED'];
  const dateFilters = ['ALL_TIME', 'TODAY', 'THIS_WEEK', 'THIS_MONTH'];
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [activeDateFilter, setActiveDateFilter] = useState('ALL_TIME');
  const [activeSchool, setActiveSchool] = useState('ALL');
  const [customerSearch, setCustomerSearch] = useState('');
  const [activeSortOrder, setActiveSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const statusLabel: Record<string, string> = {
    ALL: 'Todas', PENDING_PAYMENT: 'Pago Pend.', READY_FOR_PICKUP: 'Listo',
    PENDING_EMBROIDERY: 'Bordado', PENDING_SUPPLIER: 'Proveedor', LAYAWAY: 'Separado', COMPLETED: 'Complet.',
  };
  const dateLabel: Record<string, string> = {
    ALL_TIME: 'Todo', TODAY: 'Hoy', THIS_WEEK: 'Semana', THIS_MONTH: 'Mes',
  };

  const filterBtn = (active: boolean) => cn(
    'px-2 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0',
    active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
  );

  // count active non-default filters for badge
  const activeFilterCount = [
    activeFilter !== 'ALL',
    activeDateFilter !== 'ALL_TIME',
    activeSchool !== 'ALL',
    activeSortOrder !== 'desc',
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col bg-background h-full border-r border-border">
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-semibold">Órdenes</h1>
          <button
            onClick={() => setFiltersOpen(p => !p)}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors',
              filtersOpen ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <SlidersHorizontal size={11} />
            Filtros
            {activeFilterCount > 0 && (
              <span className={cn(
                'inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold',
                filtersOpen ? 'bg-primary-foreground text-primary' : 'bg-primary text-primary-foreground'
              )}>
                {activeFilterCount}
              </span>
            )}
            <ChevronDown size={11} className={cn('transition-transform', filtersOpen && 'rotate-180')} />
          </button>
        </div>

        {/* Search — always visible */}
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Nombre, teléfono, ID…"
            value={customerSearch}
            onChange={(e) => { setCustomerSearch(e.target.value); setCustomerSearchFilter(e.target.value); }}
            className="pl-8 h-8 text-sm"
          />
          {customerSearch && (
            <button onClick={() => { setCustomerSearch(''); setCustomerSearchFilter(''); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={12} />
            </button>
          )}
        </div>
        {customerSearch && (
          <p className="text-xs text-muted-foreground">{orders.length} resultado{orders.length !== 1 ? 's' : ''}</p>
        )}

        {/* Collapsible filters */}
        {filtersOpen && (
          <div className="space-y-3 pt-1">
            {/* Status */}
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Estado</p>
              <div className="flex gap-1 flex-wrap">
                {statuses.map(s => (
                  <button key={s} onClick={() => { setActiveFilter(s); setFilter(s); }} className={filterBtn(activeFilter === s)}>
                    {statusLabel[s] ?? s}
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Período</p>
              <div className="flex gap-1">
                {dateFilters.map(f => (
                  <button key={f} onClick={() => { setActiveDateFilter(f); setDateFilter(f); }} className={filterBtn(activeDateFilter === f)}>
                    {dateLabel[f]}
                  </button>
                ))}
              </div>
            </div>

            {/* School */}
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Escuela</p>
              <div className="flex gap-1 flex-wrap">
                <button onClick={() => { setActiveSchool('ALL'); setSchoolFilter('ALL'); }} className={filterBtn(activeSchool === 'ALL')}>Todas</button>
                <button onClick={() => { setActiveSchool('NO_SCHOOL'); setSchoolFilter('NO_SCHOOL'); }} className={filterBtn(activeSchool === 'NO_SCHOOL')}>Sin escuela</button>
                {schools.map(s => (
                  <button key={s.id} onClick={() => { setActiveSchool(s.id); setSchoolFilter(s.id); }} className={filterBtn(activeSchool === s.id)}>{s.name}</button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Orden</p>
              <div className="flex gap-1">
                <button onClick={() => { setActiveSortOrder('desc'); setSortOrder('desc'); }} className={cn(filterBtn(activeSortOrder === 'desc'), 'flex items-center gap-1')}>
                  <ArrowDown size={11} /> Recientes
                </button>
                <button onClick={() => { setActiveSortOrder('asc'); setSortOrder('asc'); }} className={cn(filterBtn(activeSortOrder === 'asc'), 'flex items-center gap-1')}>
                  <ArrowUp size={11} /> Antiguos
                </button>
              </div>
            </div>

            {/* Reset */}
            {activeFilterCount > 0 && (
              <button
                onClick={() => {
                  setActiveFilter('ALL'); setFilter('ALL');
                  setActiveDateFilter('ALL_TIME'); setDateFilter('ALL_TIME');
                  setActiveSchool('ALL'); setSchoolFilter('ALL');
                  setActiveSortOrder('desc'); setSortOrder('desc');
                }}
                className="text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      <ul className="flex-1 overflow-y-auto divide-y divide-border">
        {orders.length === 0 ? (
          <li className="p-8 text-center text-muted-foreground">
            <ArrowUpDown size={20} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">{customerSearch ? `Sin resultados para "${customerSearch}"` : 'Sin órdenes'}</p>
          </li>
        ) : (
          orders.map(order => (
            <li key={order.id}>
              <button
                onClick={() => setSelectedOrder(order)}
                className={cn(
                  'w-full text-left p-3 transition-colors border-l-2',
                  selectedOrder?.id === order.id ? 'bg-accent border-l-primary' : 'hover:bg-accent/50 border-l-transparent'
                )}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      <HighlightedText text={order.customer_name || 'Cliente Mostrador'} searchTerm={customerSearch} />
                    </p>
                    {order.customer_phone && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        <HighlightedText text={order.customer_phone} searchTerm={customerSearch} />
                      </p>
                    )}
                    {order.school_name && (
                      <p className="text-xs text-sky-600 dark:text-sky-400 mt-0.5 truncate font-medium">
                        <HighlightedText text={order.school_name} searchTerm={customerSearch} />
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(order.created_at).toLocaleDateString('es-MX', { month: 'short', day: 'numeric', year: '2-digit' })}
                    </p>
                  </div>
                  <p className="text-sm font-semibold font-mono tabular-nums shrink-0">${(order.total || 0).toFixed(2)}</p>
                </div>
                <div className="flex justify-between items-center mt-1.5">
                  <p className="text-[10px] text-muted-foreground font-mono">
                    #<HighlightedText text={order.id.toUpperCase().slice(0, 8)} searchTerm={customerSearch} />
                  </p>
                  <div className="shrink-0"><MultiStatusBadges statuses={order.active_statuses} /></div>
                </div>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Order Detail Column
// ─────────────────────────────────────────────────────────────
const OrderDetailColumn = ({ order, onRefresh }: { order: Order | null; onRefresh: () => Promise<void> }) => {
  const [isUpdating, startUpdateTransition] = useTransition();
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [pendingDeliveryChange, setPendingDeliveryChange] = useState<{ itemId: string; itemName: string; delivered: boolean } | null>(null);

  const availableStatuses = [
    { key: 'PENDING_PAYMENT', label: 'Pago Pendiente', description: 'Cliente debe completar el pago' },
    { key: 'PENDING_SUPPLIER', label: 'Pendiente Proveedor', description: 'Esperando productos del proveedor' },
    { key: 'PENDING_EMBROIDERY', label: 'Pendiente Bordado', description: 'Requiere trabajo de bordado' },
    { key: 'READY_FOR_PICKUP', label: 'Listo para Entrega', description: 'Orden lista para entregar' },
    { key: 'DELIVERED', label: 'Entregado', description: 'Orden entregada al cliente' },
    { key: 'COMPLETED', label: 'Completado', description: 'Proceso finalizado' },
  ];

  useEffect(() => { if (order) setSelectedStatuses(order.active_statuses || []); }, [order]);

  if (!order) return (
    <div className="flex flex-col items-center justify-center h-full bg-muted/20 text-center p-8">
      <div className="h-14 w-14 bg-muted rounded-full flex items-center justify-center mb-4">
        <ArrowUpDown size={20} className="text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">Selecciona una orden</h2>
      <p className="mt-1 text-sm text-muted-foreground">Toca una orden de la lista para ver sus detalles.</p>
    </div>
  );

  const handleStatusToggle = (key: string) => setSelectedStatuses(prev => prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]);

  const handleUpdateStatuses = () => {
    startUpdateTransition(async () => {
      const result = await updateOrderMultipleStatuses(order.id, selectedStatuses, 'admin_user');
      if (result.success) { await onRefresh(); setShowStatusModal(false); }
      else alert(`Error: ${result.message}`);
    });
  };

  const handleItemDeliveryToggle = (itemId: string, itemName: string, delivered: boolean) => {
    setPendingDeliveryChange({ itemId, itemName, delivered });
    setShowDeliveryModal(true);
  };

  const handleConfirmDelivery = async () => {
    if (!pendingDeliveryChange) return;
    const result = await updateItemDeliveryStatus(pendingDeliveryChange.itemId, pendingDeliveryChange.delivered);
    if (result.success) { await onRefresh(); setShowDeliveryModal(false); setPendingDeliveryChange(null); }
    else alert(`Error: ${result.message}`);
  };

  const handleUpdateAllDelivery = async (orderId: string, delivered: boolean) => {
    const result = await updateAllItemsDeliveryStatus(orderId, delivered);
    if (result.success) await onRefresh();
    else alert(`Error: ${result.message}`);
  };

  return (
    <div className="flex flex-col h-full bg-muted/20">
      {/* Header */}
      <header className="bg-background border-b border-border px-4 py-2.5 flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-sm font-semibold font-mono">#{order.id.toUpperCase().slice(0, 8)}</h2>
          <p className="text-xs text-muted-foreground truncate max-w-48">{order.customer_name || 'Cliente Mostrador'}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="xs" onClick={() => window.open(`/admin/orders/${order.id}`, '_blank')}>Recibo</Button>
          <MultiCopyPrintButton
            orderId={order.id}
            orderHasEmbroidery={!!order.embroidery_notes}
            className="inline-flex items-center gap-1 h-6 px-2 rounded-md border border-input bg-background text-xs font-medium text-foreground hover:bg-accent transition-colors"
            buttonText="Múltiples"
            showIcons={false}
          />
          <Button variant="outline" size="xs" onClick={() => setShowStatusModal(true)}>Estado</Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Order summary */}
        <div className="bg-background border border-border rounded-lg p-4 space-y-3 text-sm">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resumen de Orden</h3>
          {order.encargo_id && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Origen</span>
              <a href={`/admin/encargos/${order.encargo_id}`} target="_blank" rel="noopener noreferrer">
                <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 border-purple-200 hover:bg-purple-500/20 dark:text-purple-400 dark:border-purple-800">
                  Encargo #{order.encargo_id.slice(0, 8)}
                </Badge>
              </a>
            </div>
          )}
          <div className="flex justify-between items-start">
            <span className="text-muted-foreground">Estados</span>
            <MultiStatusBadges statuses={order.active_statuses} />
          </div>
          <div className="flex justify-between"><span className="text-muted-foreground">Fecha</span><span className="font-medium">{new Date(order.created_at).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Vendedor</span><span className="font-medium">{order.seller_name || 'N/A'}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Pago</span><span className="font-medium">{order.payment_method}</span></div>
          {order.is_layaway && (
            <>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tipo</span>
                <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 border-purple-200 dark:text-purple-400 dark:border-purple-800">Separado</Badge>
              </div>
              <div className="flex justify-between"><span className="text-muted-foreground">Anticipo</span><span className="font-mono">${order.down_payment.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Saldo</span><span className="font-mono">${order.remaining_balance.toFixed(2)}</span></div>
            </>
          )}
        </div>

        {/* Items */}
        <div className="bg-background border border-border rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Productos</h3>
            <div className="flex gap-1.5">
              <Button variant="outline" size="xs" onClick={() => handleUpdateAllDelivery(order.id, true)} className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">✓ Todos</Button>
              <Button variant="outline" size="xs" onClick={() => handleUpdateAllDelivery(order.id, false)}>✗ Ninguno</Button>
            </div>
          </div>
          <ul className="divide-y divide-border">
            {order.items.map(item => (
              <li key={item.item_id} className="py-2.5">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-start gap-2 flex-1">
                    <label className="flex items-center cursor-pointer mt-0.5 shrink-0">
                      <input
                        type="checkbox"
                        checked={item.delivered}
                        onChange={(e) => handleItemDeliveryToggle(item.item_id, item.product_name, e.target.checked)}
                        className="rounded border-border accent-primary"
                      />
                    </label>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{item.sku} · {item.size} · {item.color} · ×{item.quantity}</p>
                      <p className="text-[10px] mt-0.5">{item.delivered ? <span className="text-emerald-600 font-medium">✓ Entregado</span> : <span className="text-amber-600 font-medium">Pendiente</span>}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold font-mono tabular-nums shrink-0">${((item.price_at_sale || 0) * item.quantity).toFixed(2)}</p>
                </div>
              </li>
            ))}
          </ul>
          <Separator className="my-3" />
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="font-mono">${(order.subtotal || 0).toFixed(2)}</span></div>
            {order.discount_amount > 0 && <div className="flex justify-between text-destructive"><span>Descuento</span><span className="font-mono">−${order.discount_amount.toFixed(2)}</span></div>}
            <div className="flex justify-between font-semibold text-base"><span>Total</span><span className="font-mono">${(order.total || 0).toFixed(2)}</span></div>
          </div>
        </div>

        {(order.embroidery_notes || order.school_name) && (
          <div className="bg-background border border-border rounded-lg p-4 space-y-2 text-sm">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Detalles adicionales</h3>
            {order.school_name && <p><span className="font-medium text-foreground">Escuela: </span><span className="text-muted-foreground">{order.school_name}</span></p>}
            {order.embroidery_notes && <p><span className="font-medium text-foreground">Bordado: </span><span className="text-muted-foreground whitespace-pre-wrap">{order.embroidery_notes}</span></p>}
          </div>
        )}
      </div>

      {/* Delivery modal */}
      <Dialog open={showDeliveryModal} onOpenChange={() => { setShowDeliveryModal(false); setPendingDeliveryChange(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{pendingDeliveryChange?.delivered ? 'Confirmar Entrega' : 'Confirmar Cambio'}</DialogTitle>
          </DialogHeader>
          <div className="bg-muted/40 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-foreground">{pendingDeliveryChange?.itemName}</p>
            <p className="text-xs text-muted-foreground mt-1 font-mono">#{order.id.toUpperCase().slice(0, 8)}</p>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            {pendingDeliveryChange?.delivered ? '¿Confirmas que este ítem fue entregado?' : '¿Marcar como pendiente de entrega?'}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setShowDeliveryModal(false); setPendingDeliveryChange(null); }} className="flex-1">Cancelar</Button>
            <Button onClick={handleConfirmDelivery} className={cn("flex-1", pendingDeliveryChange?.delivered ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-600 hover:bg-amber-700")}>
              {pendingDeliveryChange?.delivered ? 'Confirmar Entrega' : 'Marcar Pendiente'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Status modal */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Estados de la Orden</DialogTitle>
            <p className="text-xs text-muted-foreground">Selecciona todos los estados aplicables</p>
          </DialogHeader>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {availableStatuses.map(s => {
              const isSelected = selectedStatuses.includes(s.key);
              return (
                <label key={s.key} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer transition-colors">
                  <input type="checkbox" checked={isSelected} onChange={() => handleStatusToggle(s.key)} className="rounded border-border accent-primary mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{s.label}</span>
                      {isSelected && <StatusBadge status={s.key} />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                    {s.key === 'COMPLETED' && isSelected && <p className="text-xs text-amber-600 mt-1 font-medium">⚠ Desactiva otros estados</p>}
                  </div>
                </label>
              );
            })}
          </div>
          <div className="bg-muted/40 rounded-lg p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">Actuales:</p>
            <MultiStatusBadges statuses={order.active_statuses || []} />
            {selectedStatuses.length > 0 && (
              <>
                <p className="text-xs font-medium text-muted-foreground mt-2 mb-2">Nuevos:</p>
                <MultiStatusBadges statuses={selectedStatuses} />
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => { setShowStatusModal(false); setSelectedStatuses(order.active_statuses || []); }}>Cancelar</Button>
            <Button className="flex-1" onClick={handleUpdateStatuses} disabled={isUpdating}>
              {isUpdating ? 'Actualizando…' : 'Guardar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
export default function OrdersInteractivePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL_TIME');
  const [schoolFilter, setSchoolFilter] = useState('ALL');
  const [customerSearchFilter, setCustomerSearchFilter] = useState('');
  const [schools, setSchools] = useState<School[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const supabase = createClient();

  const filterByDate = (orders: Order[], f: string) => {
    if (f === 'ALL_TIME') return orders;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return orders.filter(o => {
      const d = new Date(o.created_at);
      const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      if (f === 'TODAY') return day.getTime() === today.getTime();
      if (f === 'THIS_WEEK') { const w = new Date(today); w.setDate(today.getDate() - today.getDay()); return d >= w && d <= now; }
      if (f === 'THIS_MONTH') { const m = new Date(today.getFullYear(), today.getMonth(), 1); return d >= m && d <= now; }
      return true;
    });
  };

  const filterBySchool = useCallback((orders: Order[], sf: string) => {
    if (sf === 'ALL') return orders;
    if (sf === 'NO_SCHOOL') return orders.filter(o => !o.school_name);
    const school = schools.find(s => s.id === sf);
    return orders.filter(o => school && o.school_name === school.name);
  }, [schools]);

  const filterByCustomer = useCallback((orders: Order[], q: string) => {
    if (!q.trim()) return orders;
    const s = q.toLowerCase().trim();
    return orders.filter(o =>
      (o.customer_name?.toLowerCase() || '').includes(s) ||
      (o.customer_phone?.toLowerCase() || '').includes(s) ||
      o.id.toLowerCase().slice(0, 8).includes(s) ||
      (o.school_name?.toLowerCase() || '').includes(s) ||
      (o.seller_name?.toLowerCase() || '').includes(s)
    );
  }, []);

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase.from('full_order_details_with_statuses').select('*').order('order_date', { ascending: false });
    if (error) { console.error(error); setIsLoading(false); return; }
    const map = new Map<string, Order>();
    data.forEach((row: OrderViewRow) => {
      if (!map.has(row.order_id)) {
        let activeStatuses = row.active_statuses || [];
        if (row.is_layaway && !activeStatuses.includes('LAYAWAY')) activeStatuses = [...activeStatuses, 'LAYAWAY'];
        map.set(row.order_id, {
          id: row.order_id, created_at: row.order_date, total: row.order_total,
          status: row.order_status, active_statuses: activeStatuses,
          subtotal: row.subtotal, discount_amount: row.discount_amount, discount_reason: row.discount_reason,
          customer_name: row.customer_name, customer_phone: row.customer_phone, seller_name: row.seller_name,
          payment_method: row.payment_method, embroidery_notes: row.embroidery_notes,
          requires_invoice: row.requires_invoice, school_name: row.school_name,
          is_layaway: row.is_layaway, down_payment: row.down_payment, remaining_balance: row.remaining_balance,
          encargo_id: row.encargo_id ?? null, items: [],
        });
      }
      map.get(row.order_id)!.items.push({
        item_id: row.item_id, product_name: row.product_name, sku: row.sku,
        color: row.color, size: row.size, quantity: row.quantity, price_at_sale: row.price_at_sale,
        delivered: row.delivered || false,
      });
    });
    setOrders(Array.from(map.values()));
  }, [supabase]);

  const fetchSchools = useCallback(async () => {
    try { setSchools(await getSchools()); } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchOrders(), fetchSchools()]).finally(() => setIsLoading(false));
    const channel = supabase.channel('realtime-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, fetchOrders)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchOrders, fetchSchools, supabase]);

  useEffect(() => {
    const statusFiltered = filter === 'ALL' ? orders : orders.filter(o => {
      const s = o.active_statuses?.length > 0 ? o.active_statuses : [o.status];
      return s.includes(filter);
    });
    const dateFiltered = filterByDate(statusFiltered, dateFilter);
    const schoolFiltered = filterBySchool(dateFiltered, schoolFilter);
    const customerFiltered = filterByCustomer(schoolFiltered, customerSearchFilter);
    const sorted = [...customerFiltered].sort((a, b) => {
      const da = new Date(a.created_at).getTime(), db = new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? db - da : da - db;
    });
    setFilteredOrders(sorted);
    const inList = sorted.some(o => o.id === selectedOrder?.id);
    if (!inList) setSelectedOrder(sorted.length > 0 ? sorted[0] : null);
    else { const updated = sorted.find(o => o.id === selectedOrder?.id); if (updated) setSelectedOrder(updated); }
  }, [filter, dateFilter, schoolFilter, customerSearchFilter, sortOrder, orders, selectedOrder?.id, schools, filterBySchool, filterByCustomer]);

  if (isLoading && orders.length === 0) {
    return <div className="flex items-center justify-center h-full text-muted-foreground"><p className="text-sm">Cargando órdenes…</p></div>;
  }

  return (
    <div style={{ height: 'calc(100vh - 3.5rem)' }} className="w-full flex overflow-hidden">
      <div className="w-72 xl:w-80 h-full shrink-0">
        <OrderListColumn
          orders={filteredOrders} selectedOrder={selectedOrder} setSelectedOrder={setSelectedOrder}
          setFilter={setFilter} setSortOrder={setSortOrder} setDateFilter={setDateFilter}
          setSchoolFilter={setSchoolFilter} setCustomerSearchFilter={setCustomerSearchFilter}
          schools={schools}
        />
      </div>
      <div className="flex-1 h-full">
        <OrderDetailColumn order={selectedOrder} onRefresh={fetchOrders} />
      </div>
    </div>
  );
}
