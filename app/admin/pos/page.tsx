// @/app/admin/pos/page.tsx
"use client";

import React, { useState, useEffect, useMemo, useTransition, useRef, useImperativeHandle, forwardRef } from 'react';
import { useRouter } from 'next/navigation';
import { getGroupedProducts, processSaleAction, SalePayload, GroupedProduct, ProductColorVariant, ProductVariant, getSchools, findProductByBarcode } from './actions';
import { updateOrderMultipleStatuses } from '../orders/multiple-status-actions';
import { updateAllItemsDeliveryStatus, updateItemDeliveryByInventoryId } from '../orders/actions';
import Image from 'next/image';

// --- Tipos de Datos ---
export type School = {
    id: string;
    name: string;
};

export type CartItem = {
    inventory_id: string;
    product_name: string;
    image_url: string | null;
    size: string;
    color: string;
    price: number;
    barcode: string;
    quantity: number;
};

type SpecialOrderDetails = {
    customerName?: string;
    customerPhone?: string;
    schoolId?: string | null;
    embroideryNotes?: string;
};

export interface PosCartRef {
    resetLayaway: () => void;
}

// Componente para mostrar badges de estado
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'PENDING_PAYMENT': return 'bg-red-100 text-red-800';
            case 'PENDING_SUPPLIER': return 'bg-orange-100 text-orange-800';
            case 'PENDING_EMBROIDERY': return 'bg-purple-100 text-purple-800';
            case 'READY_FOR_PICKUP': return 'bg-blue-100 text-blue-800';
            case 'DELIVERED': return 'bg-green-100 text-green-800';
            case 'COMPLETED': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusStyles(status)}`}>
            {status.replace('_', ' ')}
        </span>
    );
};

// --- Iconos ---
// Usaremos un enfoque simple para los iconos para mantener el ejemplo autocontenido.
// En una app real, probablemente usarías una librería como heroicons.
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
);
const ShoppingBagIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.658-.463 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
);
const MinusIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></svg>
);
const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
);
const CheckboxIcon = ({ checked }: { checked: boolean }) => (
    <div className={`w-6 h-6 rounded-md border-2 ${checked ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300'} flex items-center justify-center transition-colors`}>
        {checked && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
    </div>
);


// --- Tipos para las Props de los Componentes de Vista ---
interface PosViewProps {
    cart: CartItem[];
    schools: School[];
    handleAddToCart: (item: CartItem) => void;
    handleUpdateQuantity: (inventoryId: string, newQuantity: number) => void;
    handleProcessSale: (paymentMethod: string, discount: number, total: number) => void;
    isProcessing: boolean;
    requiresInvoice: boolean;
    setRequiresInvoice: React.Dispatch<React.SetStateAction<boolean>>;
    isSpecialOrder: boolean;
    setIsSpecialOrder: React.Dispatch<React.SetStateAction<boolean>>;
    handleSpecialOrderDetailsSave: (details: SpecialOrderDetails) => void;
    hasPendingPayment: boolean;
    error: string | null;
    setError: React.Dispatch<React.SetStateAction<string | null>>;
}

interface TabletPosViewProps extends PosViewProps {
    products: GroupedProduct[];
}

// Using type alias instead of empty interface to avoid TypeScript warning
type DesktopPosViewProps = PosViewProps;


// #########################################################################
// ############# VISTA PARA TABLET/IPAD (NUEVO DISEÑO) #####################
// #########################################################################

const TabletPosView: React.FC<TabletPosViewProps> = ({ cart, schools, products, handleAddToCart, handleUpdateQuantity, handleProcessSale, isProcessing, requiresInvoice, setRequiresInvoice, isSpecialOrder, setIsSpecialOrder, handleSpecialOrderDetailsSave, hasPendingPayment, error }) => {
    const [selectedProduct, setSelectedProduct] = useState<GroupedProduct | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredProducts, setFilteredProducts] = useState<GroupedProduct[]>(products);
    const [isSpecialOrderModalOpen, setSpecialOrderModalOpen] = useState(false);
    const posCartRef = useRef<PosCartRef>(null);

    useEffect(() => {
        const result = products.filter(p => p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku_base.toLowerCase().includes(searchTerm.toLowerCase()));
        setFilteredProducts(result);
    }, [searchTerm, products]);

    return (
        <div className="h-screen w-screen flex font-sans antialiased text-gray-900 overflow-hidden">
            {/* Carrito de Compras - Responsive sin anchos fijos */}
            <div className="flex-shrink-0 w-full sm:w-2/5 min-w-0 max-w-2xl h-full border-r border-gray-200">
                <PosCart 
                    ref={posCartRef}
                    items={cart} 
                    onUpdateQuantity={handleUpdateQuantity} 
                    onProcessSale={handleProcessSale} 
                    isProcessing={isProcessing} 
                    requiresInvoice={requiresInvoice} 
                    setRequiresInvoice={setRequiresInvoice} 
                    isSpecialOrder={isSpecialOrder} 
                    setIsSpecialOrder={setIsSpecialOrder} 
                    onOpenSpecialOrderModal={() => setSpecialOrderModalOpen(true)} 
                />
            </div>
            
            {/* Selector de Productos - Se adapta al espacio restante */}
            <div className="flex-1 min-w-0 h-full flex flex-col bg-gray-50">
                <div className="flex-shrink-0 p-2 sm:p-4 bg-white sticky top-0 z-10 border-b border-gray-200 shadow-sm">
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o SKU..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className="w-full p-2 sm:p-4 text-sm sm:text-lg border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <div className="flex-1 overflow-y-auto p-2 sm:p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
                    {filteredProducts.map(product => (
                        <button 
                            key={product.sku_base} 
                            onClick={() => setSelectedProduct(product)} 
                            className="bg-white rounded-xl sm:rounded-2xl shadow-md p-2 sm:p-4 text-center flex flex-col justify-between items-center hover:ring-2 hover:ring-indigo-500 transition-all duration-200 hover:shadow-lg min-w-0"
                        >
                            <Image 
                                src={product.colors[0]?.image_url || '/placeholder.jpg'} 
                                alt={product.product_name} 
                                width={300} 
                                height={300} 
                                className="w-full h-20 sm:h-32 object-cover rounded-lg mb-2 sm:mb-4" 
                            />
                            <div className="flex-1 min-w-0 w-full">
                                <p className="font-bold text-gray-800 text-xs sm:text-sm truncate">{product.product_name}</p>
                            </div>
                            <p className="mt-1 sm:mt-2 text-xs text-gray-500">{product.colors.length} colores</p>
                        </button>
                    ))}
                </div>
            </div>
            {selectedProduct && <VariantSelectionModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onAddToCart={handleAddToCart} />}
            <SpecialOrderModal 
                isOpen={isSpecialOrderModalOpen} 
                onClose={() => {
                    setSpecialOrderModalOpen(false);
                    // NO resetear isSpecialOrder ni layaway aquí, solo cerrar el modal
                }} 
                onCancel={() => {
                    // Cuando se cancela, deseleccionar las opciones
                    setIsSpecialOrder(false);
                    posCartRef.current?.resetLayaway();
                }}
                onSave={handleSpecialOrderDetailsSave} 
                schools={schools}
                hasPendingPayment={hasPendingPayment}
            />
            {error && <div className="absolute bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50"><strong className="font-bold">Error: </strong><span className="block sm:inline">{error}</span></div>}
        </div>
    );
};

// --- Componente: Carrito de Compra (Compartido) ---
const PosCart = forwardRef<PosCartRef, { 
    items: CartItem[], 
    onUpdateQuantity: (inventoryId: string, newQuantity: number) => void, 
    onProcessSale: (paymentMethod: string, discount: number, total: number, isLayaway?: boolean, downPayment?: number) => void, 
    isProcessing: boolean, 
    requiresInvoice: boolean, 
    setRequiresInvoice: (value: boolean) => void, 
    isSpecialOrder: boolean, 
    setIsSpecialOrder: (value: boolean) => void, 
    onOpenSpecialOrderModal: () => void
}>(({ 
    items, 
    onUpdateQuantity, 
    onProcessSale, 
    isProcessing, 
    requiresInvoice, 
    setRequiresInvoice, 
    isSpecialOrder, 
    setIsSpecialOrder, 
    onOpenSpecialOrderModal
}, ref) => {
    const [discount, setDiscount] = useState(0);
    const [isLayaway, setIsLayaway] = useState(false);
    const [downPayment, setDownPayment] = useState(0);
    const subtotal = useMemo(() => items.reduce((acc, item) => acc + item.price * item.quantity, 0), [items]);
    const iva = useMemo(() => requiresInvoice ? (subtotal - discount) * 0.16 : 0, [subtotal, discount, requiresInvoice]);
    const total = useMemo(() => subtotal - discount + iva, [subtotal, discount, iva]);
    const remainingBalance = useMemo(() => isLayaway ? total - downPayment : 0, [isLayaway, total, downPayment]);

    const handleQuantityChange = (inventoryId: string, delta: number) => {
        const item = items.find(i => i.inventory_id === inventoryId);
        if (item) {
            const newQuantity = item.quantity + delta;
            onUpdateQuantity(inventoryId, newQuantity);
        }
    };

    const handleSpecialOrderToggle = () => {
        const newIsSpecialOrder = !isSpecialOrder;
        setIsSpecialOrder(newIsSpecialOrder);
        if (newIsSpecialOrder) {
            // Solo abrir el modal si no hay detalles guardados
            onOpenSpecialOrderModal();
        }
        // Si se desactiva "Especial", mantener los detalles pero no forzar el modal
    };

    const handleLayawayToggle = () => {
        const newIsLayaway = !isLayaway;
        setIsLayaway(newIsLayaway);
        if (newIsLayaway) {
            // Al activar separado, por defecto requerir datos del cliente
            if (!isSpecialOrder) {
                setIsSpecialOrder(true);
                onOpenSpecialOrderModal();
            }
            // Establecer un anticipo por defecto del 50%
            setDownPayment(total * 0.5);
        } else {
            setDownPayment(0);
        }
    };

    const handleDownPaymentChange = (value: number) => {
        const clampedValue = Math.max(0, Math.min(value, total));
        setDownPayment(clampedValue);
    };

    // Exponer funciones al componente padre através del ref
    useImperativeHandle(ref, () => ({
        resetLayaway: () => {
            setIsLayaway(false);
            setDownPayment(0);
        }
    }));

    return (
        <div className="bg-white h-full flex flex-col shadow-2xl min-w-0">
            {/* Header del Carrito */}
            <div className="flex-shrink-0 p-3 sm:p-4 lg:p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">Venta Actual</h2>
                {items.length > 0 && (
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">{items.length} producto{items.length > 1 ? 's' : ''} en el carrito</p>
                )}
            </div>
            
            {/* Lista de Productos - Responsive */}
            <ul className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-3 lg:p-4 divide-y divide-gray-100">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center text-gray-400 h-full p-4 sm:p-8">
                        <ShoppingBagIcon className="h-16 w-16 sm:h-20 sm:w-20 mb-4"/>
                        <p className="font-medium text-base sm:text-lg">El carrito está vacío</p>
                        <p className="text-xs sm:text-sm">Agrega productos escaneando códigos de barras</p>
                    </div>
                ) : (
                    items.map(item => (
                        <li key={item.inventory_id} className="py-3 sm:py-4 lg:py-5">
                            <div className="flex items-start gap-2 sm:gap-3 lg:gap-4 min-w-0">
                                {/* Imagen del Producto - Responsive */}
                                <div className="flex-shrink-0">
                                    <Image 
                                        src={item.image_url || '/placeholder.jpg'} 
                                        alt={item.product_name} 
                                        width={80} 
                                        height={80} 
                                        className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 object-cover rounded-lg bg-gray-200 shadow-sm" 
                                    />
                                </div>
                                
                                {/* Información del Producto - Se adapta al espacio */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm sm:text-base lg:text-lg leading-tight truncate">
                                        {item.product_name}
                                    </p>
                                    <div className="flex flex-wrap gap-1 sm:gap-2 mt-1">
                                        <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                            {item.size}
                                        </span>
                                        <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                            {item.color}
                                        </span>
                                    </div>
                                    <div className="mt-1 sm:mt-2 space-y-0.5 sm:space-y-1">
                                        <p className="text-sm sm:text-base lg:text-lg font-bold text-green-600">
                                            ${item.price.toFixed(2)}
                                        </p>
                                        <p className="text-xs sm:text-sm text-gray-600">
                                            Subtotal: ${(item.price * item.quantity).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Controles de Cantidad - Compactos pero usables */}
                                <div className="flex-shrink-0 flex flex-col items-center gap-1 sm:gap-2">
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        <button 
                                            onClick={() => handleQuantityChange(item.inventory_id, -1)} 
                                            className="p-1.5 sm:p-2 lg:p-3 rounded-full bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
                                        >
                                            <MinusIcon className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                                        </button>
                                        <span className="font-bold text-base sm:text-lg lg:text-xl w-8 sm:w-10 lg:w-12 text-center bg-gray-50 rounded-lg py-1 sm:py-2 px-2 sm:px-3 border text-black">
                                            {item.quantity}
                                        </span>
                                        <button 
                                            onClick={() => handleQuantityChange(item.inventory_id, 1)} 
                                            className="p-1.5 sm:p-2 lg:p-3 rounded-full bg-green-100 hover:bg-green-200 text-green-700 transition-colors"
                                        >
                                            <PlusIcon className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 font-medium text-center">
                                        Cantidad
                                    </p>
                                </div>
                            </div>
                        </li>
                    ))
                )}
            </ul>
            
            {/* Sección de Totales y Controles - Responsive */}
            <div className="flex-shrink-0 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 min-w-0">
                {/* Opciones de Venta */}
                <div className="p-2 sm:p-3 lg:p-4">
                    <div className="grid grid-cols-3 gap-1 sm:gap-2">
                        <button 
                            onClick={() => setRequiresInvoice(!requiresInvoice)} 
                            className="flex flex-col sm:flex-row items-center justify-center sm:justify-between p-2 sm:p-3 rounded-lg bg-white hover:bg-gray-50 transition-colors border border-gray-200 shadow-sm min-w-0"
                        >
                            <span className="font-medium text-gray-800 text-xs sm:text-sm truncate">Factura</span>
                            <CheckboxIcon checked={requiresInvoice} />
                        </button>
                        <button 
                            onClick={handleSpecialOrderToggle} 
                            className="flex flex-col sm:flex-row items-center justify-center sm:justify-between p-2 sm:p-3 rounded-lg bg-white hover:bg-gray-50 transition-colors border border-gray-200 shadow-sm min-w-0"
                        >
                            <span className="font-medium text-gray-800 text-xs sm:text-sm truncate">Especial</span>
                            <CheckboxIcon checked={isSpecialOrder} />
                        </button>
                        <button 
                            onClick={handleLayawayToggle} 
                            className="flex flex-col sm:flex-row items-center justify-center sm:justify-between p-2 sm:p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200 shadow-sm min-w-0"
                        >
                            <span className="font-medium text-blue-800 text-xs sm:text-sm truncate">Separado</span>
                            <CheckboxIcon checked={isLayaway} />
                        </button>
                    </div>
                </div>

                {/* Totales */}
                <div className="px-2 sm:px-3 lg:px-4 pb-2 sm:pb-3 lg:pb-4">
                    <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border">
                        <div className="space-y-2 sm:space-y-3">
                            <div className="flex justify-between items-center text-sm sm:text-base">
                                <span className="font-medium text-gray-700">Subtotal</span>
                                <span className="font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                                <label htmlFor="discount" className="font-medium text-gray-700 text-sm sm:text-base">Descuento</label>
                                <div className="flex items-center space-x-1 sm:space-x-2">
                                    <span className="text-gray-500 text-sm">$</span>
                                    <input 
                                        id="discount" 
                                        type="number" 
                                        value={discount} 
                                        onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))} 
                                        className="text-black w-16 sm:w-20 p-1.5 sm:p-2 text-right font-semibold border border-gray-300 rounded-md text-xs sm:text-sm"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                            
                            {requiresInvoice && (
                                <div className="flex justify-between text-gray-600 text-sm sm:text-base">
                                    <span>IVA (16%)</span>
                                    <span className="font-medium">${iva.toFixed(2)}</span>
                                </div>
                            )}
                            
                            <div className="border-t pt-2 sm:pt-3 mt-2 sm:mt-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg sm:text-xl font-bold text-gray-900">TOTAL</span>
                                    <span className="text-xl sm:text-2xl font-bold text-indigo-600">${total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detalles del Separado */}
                {isLayaway && (
                    <div className="px-2 sm:px-3 lg:px-4 pb-2 sm:pb-3 lg:pb-4">
                        <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200 space-y-2 sm:space-y-3">
                            <h4 className="font-semibold text-blue-900 flex items-center text-sm sm:text-base">
                                💳 Detalles del Separado
                            </h4>
                            <div className="flex justify-between items-center">
                                <label htmlFor="downPayment" className="font-medium text-blue-800 text-sm">Anticipo</label>
                                <div className="flex items-center space-x-1 sm:space-x-2">
                                    <span className="text-blue-600 text-sm">$</span>
                                    <input 
                                        id="downPayment" 
                                        type="number" 
                                        value={downPayment} 
                                        onChange={(e) => handleDownPaymentChange(parseFloat(e.target.value) || 0)} 
                                        className="text-black w-20 sm:w-24 p-1.5 sm:p-2 text-right font-bold border border-blue-300 rounded-md text-xs sm:text-sm"
                                        max={total}
                                        min={0}
                                        step="0.01"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between text-blue-800 text-sm">
                                <span>Saldo Pendiente:</span>
                                <span className="font-bold">${remainingBalance.toFixed(2)}</span>
                            </div>
                            {downPayment <= 0 && (
                                <p className="text-red-600 text-xs sm:text-sm font-medium flex items-center">
                                    <span className="mr-1">⚠️</span> El anticipo debe ser mayor a $0
                                </p>
                            )}
                            {downPayment >= total && (
                                <p className="text-green-600 text-xs sm:text-sm font-medium flex items-center">
                                    <span className="mr-1">✅</span> Pago completo
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Botones de Pago */}
                <div className="p-2 sm:p-3 lg:p-4">
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <button 
                            onClick={() => onProcessSale('Efectivo', discount, total, isLayaway, downPayment)} 
                            disabled={isProcessing || items.length === 0 || (isLayaway && downPayment <= 0)} 
                            className="w-full p-3 sm:p-4 text-sm sm:text-base lg:text-lg font-bold text-white bg-green-600 rounded-xl shadow-md hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center justify-center space-x-1 sm:space-x-2 min-w-0"
                        >
                            <span>💵</span>
                            <span className="truncate">Efectivo</span>
                        </button>
                        <button 
                            onClick={() => onProcessSale('Tarjeta', discount, total, isLayaway, downPayment)} 
                            disabled={isProcessing || items.length === 0 || (isLayaway && downPayment <= 0)} 
                            className="w-full p-3 sm:p-4 text-sm sm:text-base lg:text-lg font-bold text-white bg-blue-600 rounded-xl shadow-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center space-x-1 sm:space-x-2 min-w-0"
                        >
                            <span>💳</span>
                            <span className="truncate">Tarjeta</span>
                        </button>
                    </div>
                    {isProcessing && (
                        <div className="mt-3 sm:mt-4 text-center">
                            <div className="inline-flex items-center space-x-2 text-gray-800 font-medium text-sm sm:text-base">
                                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-indigo-600"></div>
                                <span>Procesando venta...</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

PosCart.displayName = 'PosCart';

// --- Componente: Modal de Selección de Variantes (Compartido) ---
const VariantSelectionModal = ({ product, onClose, onAddToCart }: { product: GroupedProduct, onClose: () => void, onAddToCart: (item: CartItem) => void }) => {
    const [selectedColor, setSelectedColor] = useState<ProductColorVariant | null>(product.colors.length === 1 ? product.colors[0] : null);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

    useEffect(() => {
        if (selectedColor && selectedColor.variants.length === 1) setSelectedVariant(selectedColor.variants[0]);
        else setSelectedVariant(null);
    }, [selectedColor]);

    const handleAddToCart = () => {
        if (selectedVariant && selectedColor) {
            onAddToCart({
                inventory_id: selectedVariant.inventory_id, product_name: product.product_name, image_url: selectedColor.image_url,
                size: selectedVariant.size, color: selectedColor.color, price: selectedVariant.price, barcode: selectedVariant.barcode, quantity: 1,
            });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-300 p-8 m-4 max-w-md w-full" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{product.product_name}</h2>
                <div className="mb-6"><h3 className="text-lg font-semibold text-gray-800 mb-3">Color</h3><div className="flex flex-wrap gap-3">{product.colors.map(color => (<button key={color.color} onClick={() => setSelectedColor(color)} className={`p-2 rounded-lg border-2 transition-all ${selectedColor?.color === color.color ? 'border-indigo-600 ring-2 ring-indigo-300' : 'border-gray-200'}`}><Image src={color.image_url || '/placeholder.jpg'} alt={color.color} width={80} height={80} className="w-20 h-20 object-cover rounded-md" /><p className="text-sm font-medium mt-1 text-center">{color.color}</p></button>))}</div></div>
                {selectedColor && <div className="mb-8"><h3 className="text-lg font-semibold text-gray-800 mb-3">Talla</h3><div className="flex flex-wrap gap-3">{selectedColor.variants.map(variant => (<button key={variant.inventory_id} onClick={() => setSelectedVariant(variant)} className={`px-6 py-3 rounded-full text-base font-bold transition-colors ${selectedVariant?.inventory_id === variant.inventory_id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}>{variant.size}</button>))}</div></div>}
                <button onClick={handleAddToCart} disabled={!selectedVariant} className="w-full p-4 text-xl font-bold text-white bg-indigo-600 rounded-xl shadow-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed">Agregar al Carrito</button>
            </div>
        </div>
    );
};

// --- Componente: Modal de Pedido Especial (Compartido) ---
const SpecialOrderModal = ({ isOpen, onClose, onSave, onCancel, schools, hasPendingPayment }: { 
    isOpen: boolean, 
    onClose: () => void, 
    onSave: (details: SpecialOrderDetails) => void, 
    onCancel?: () => void,
    schools: School[], 
    hasPendingPayment?: boolean 
}) => {
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [schoolId, setSchoolId] = useState<string | null>(null);
    const [embroideryNotes, setEmbroideryNotes] = useState('');

    if (!isOpen) return null;

    const handleSave = () => {
        console.log('💾 Usuario guardó detalles especiales - manteniendo opciones seleccionadas');
        onSave({ customerName, customerPhone, schoolId, embroideryNotes });
        onClose();
    };

    const handleCancel = () => {
        console.log('❌ Usuario canceló detalles especiales - deseleccionando opciones');
        // Llamar a onCancel si existe (para deseleccionar opciones)
        if (onCancel) {
            onCancel();
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleCancel}>
            <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-300 p-6 md:p-8 w-full max-w-lg md:max-w-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Detalles del Pedido Especial</h2>
                
                {hasPendingPayment && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-blue-800">
                                    Continuarás con la configuración de estados
                                </h3>
                                <div className="mt-2 text-sm text-blue-700">
                                    <p>Después de guardar estos detalles, se abrirá automáticamente el modal para configurar los estados de la orden.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-5">
                    <div><label htmlFor="customerName" className="block text-sm md:text-base font-semibold text-gray-700 mb-1">Nombre Completo del Cliente*</label><input type="text" id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="text-gray-700 w-full p-3 text-base border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Ej. Juan Pérez"/></div>
                    <div><label htmlFor="customerPhone" className="block text-sm md:text-base font-semibold text-gray-700 mb-1">Teléfono de Contacto</label><input type="tel" id="customerPhone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="text-gray-700 w-full p-3 text-base border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Ej. 868-123-4567"/></div>
                    <div><label htmlFor="schoolId" className="block text-sm md:text-base font-semibold text-gray-700 mb-1">Escuela (Opcional)</label><select id="schoolId" value={schoolId ?? ''} onChange={(e) => setSchoolId(e.target.value || null)} className="text-gray-700 w-full p-3 text-base border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"><option value="">Ninguna</option>{schools.map(school => (<option key={school.id} value={school.id}>{school.name}</option>))}</select></div>
                    <div><label htmlFor="embroideryNotes" className="block text-sm md:text-base font-semibold text-gray-700 mb-1">Notas de Bordado / Pedido</label><textarea id="embroideryNotes" rows={4} value={embroideryNotes} onChange={(e) => setEmbroideryNotes(e.target.value)} className="text-gray-700 w-full p-3 text-base border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Ej. Bordar 'Dr. Juan Pérez' en la filipina."></textarea></div>
                </div>
                <div className="mt-8 flex justify-end gap-4"><button onClick={handleCancel} className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold text-base">Cancelar</button><button onClick={handleSave} className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold text-base">Guardar Detalles</button></div>
            </div>
        </div>
    );
};


// #########################################################################
// ############# VISTA PARA DESKTOP (DISEÑO ORIGINAL) ######################
// #########################################################################

const DesktopPosView: React.FC<DesktopPosViewProps> = ({ cart, schools, handleAddToCart, handleUpdateQuantity, handleProcessSale, isProcessing, requiresInvoice, setRequiresInvoice, isSpecialOrder, setIsSpecialOrder, handleSpecialOrderDetailsSave, hasPendingPayment, error, setError }) => {
    const [isSpecialOrderModalOpen, setSpecialOrderModalOpen] = useState(false);
    const barcodeInputRef = useRef<HTMLInputElement>(null);
    const posCartRef = useRef<PosCartRef>(null);
    const [isBarcodeProcessing, startBarcodeTransition] = useTransition();

    const focusBarcodeInput = () => {
        setTimeout(() => barcodeInputRef.current?.focus(), 100);
    };

    useEffect(() => {
        focusBarcodeInput();
    }, []);

    const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const barcode = formData.get('barcode') as string;
        if (!barcode.trim()) return;
        
        setError(null);
        startBarcodeTransition(async () => {
            const result = await findProductByBarcode(barcode.trim());
            if (barcodeInputRef.current) barcodeInputRef.current.value = "";
            
            if (result.success && result.data) {
                const product = result.data;
                handleAddToCart({
                    inventory_id: product.inventory_id, product_name: product.product_name, image_url: product.image_url,
                    size: product.size, color: product.color, price: product.price, barcode: product.barcode, quantity: 1,
                });
            } else {
                setError(result.message || "Producto no encontrado.");
                setTimeout(() => setError(null), 3000);
            }
            focusBarcodeInput();
        });
    };

    return (
        <div className="flex flex-col lg:flex-row h-screen bg-gray-100 font-sans overflow-hidden">
            {/* Carrito de Compras - Responsive y sin scroll horizontal */}
            <div className="w-full lg:flex-shrink-0 lg:w-3/5 bg-white shadow-lg flex flex-col min-w-0">
                <PosCart 
                    ref={posCartRef}
                    items={cart} 
                    onUpdateQuantity={handleUpdateQuantity} 
                    onProcessSale={handleProcessSale} 
                    isProcessing={isProcessing} 
                    requiresInvoice={requiresInvoice} 
                    setRequiresInvoice={setRequiresInvoice} 
                    isSpecialOrder={isSpecialOrder} 
                    setIsSpecialOrder={setIsSpecialOrder} 
                    onOpenSpecialOrderModal={() => setSpecialOrderModalOpen(true)} 
                />
            </div>
            
            {/* Scanner/Búsqueda - Se adapta al espacio restante */}
            <div className="w-full lg:flex-1 min-w-0 p-4 lg:p-6 flex flex-col justify-center">
                <div className="max-w-md mx-auto w-full">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Punto de Venta</h1>
                    <p className="text-sm sm:text-base text-gray-700 mb-4 lg:mb-6 font-medium">Escanee un código de barras para añadirlo a la venta.</p>
                    <form onSubmit={handleSearchSubmit} className='mb-4 lg:mb-6'>
                        <div className="relative">
                            <input 
                                ref={barcodeInputRef} 
                                type="text" 
                                name="barcode" 
                                placeholder="Esperando código de barras..." 
                                className="text-gray-600 w-full pl-4 pr-12 sm:pr-16 py-3 sm:py-4 text-base sm:text-lg bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                                disabled={isBarcodeProcessing} 
                                autoComplete="off" 
                            />
                            <button 
                                type="submit" 
                                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-indigo-600" 
                                disabled={isBarcodeProcessing}
                            >
                                <SearchIcon className="h-5 w-5 sm:h-7 sm:w-7" />
                            </button>
                        </div>
                    </form>
                    {isBarcodeProcessing && <p className="text-center mt-4 text-gray-800 font-medium text-sm sm:text-base">Buscando...</p>}
                    {error && <p className="text-center mt-4 text-red-700 font-semibold bg-red-100 p-3 sm:p-4 rounded-lg border border-red-200 text-sm sm:text-base">{error}</p>}
                </div>
            </div>
            <SpecialOrderModal 
                isOpen={isSpecialOrderModalOpen} 
                onClose={() => {
                    setSpecialOrderModalOpen(false);
                    // NO resetear isSpecialOrder ni layaway aquí, solo cerrar el modal
                }} 
                onCancel={() => {
                    // Cuando se cancela, deseleccionar las opciones
                    setIsSpecialOrder(false);
                    posCartRef.current?.resetLayaway();
                }}
                onSave={handleSpecialOrderDetailsSave} 
                schools={schools}
                hasPendingPayment={hasPendingPayment}
            />
        </div>
    );
};


// #########################################################################
// ############# COMPONENTE PRINCIPAL (ROUTER DE VISTAS) ###################
// #########################################################################

export default function PosPage() {
    const [viewMode, setViewMode] = useState<'loading' | 'desktop' | 'tablet'>('loading');
    const [isHydrated, setIsHydrated] = useState(false);
    
    // --- Estado Compartido ---
    const [cart, setCart] = useState<CartItem[]>([]);
    const [products, setProducts] = useState<GroupedProduct[]>([]);
    const [schools, setSchools] = useState<School[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    
    // --- Estados para Modal de Estados Múltiples (SIMPLIFICADO) ---
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [pendingPaymentData, setPendingPaymentData] = useState<{
        paymentMethod: string;
        discount: number;
        total: number;
        isLayaway: boolean;
        downPayment: number;
    } | null>(null);
    
    // --- Estados para Selección de Items Entregados ---
    const [deliveredItems, setDeliveredItems] = useState<string[]>([]);
    
    // --- Estados Disponibles ---
    const availableStatuses = [
        { key: 'PENDING_PAYMENT', label: 'Pago Pendiente', description: 'Cliente debe completar el pago' },
        { key: 'PENDING_SUPPLIER', label: 'Pendiente Proveedor', description: 'Esperando productos del proveedor' },
        { key: 'PENDING_EMBROIDERY', label: 'Pendiente Bordado', description: 'Requiere trabajo de bordado' },
        { key: 'READY_FOR_PICKUP', label: 'Listo para Entrega', description: 'Orden lista para entregar al cliente' },
        { key: 'DELIVERED', label: 'Entregado', description: 'Orden entregada al cliente' },
        { key: 'COMPLETED', label: 'Completado', description: 'Proceso finalizado completamente' },
    ];

    // --- Funciones del Modal de Estados ---
    const handleStatusToggle = (statusKey: string) => {
        setSelectedStatuses(prev => {
            if (prev.includes(statusKey)) {
                return prev.filter(s => s !== statusKey);
            } else {
                return [...prev, statusKey];
            }
        });
    };

    const handleConfirmStatusesAndProcess = () => {
        console.log('✅ Confirmando estados y procesando...');
        
        if (!pendingPaymentData) return;
        
        const statusesToApply = selectedStatuses.length > 0 ? selectedStatuses : ['COMPLETED'];
        
        // Procesar venta directamente con los estados seleccionados y items entregados
        actuallyProcessSaleWithItemDelivery(
            pendingPaymentData.paymentMethod,
            pendingPaymentData.discount,
            pendingPaymentData.total,
            pendingPaymentData.isLayaway,
            pendingPaymentData.downPayment,
            statusesToApply,
            deliveredItems
        );
        
        setShowStatusModal(false);
        setPendingPaymentData(null);
        setSelectedStatuses([]);
        setDeliveredItems([]);
    };

    const actuallyProcessSaleWithItemDelivery = (
        paymentMethod: string, 
        discount: number, 
        total: number, 
        isLayaway: boolean = false, 
        downPayment: number = 0, 
        statusesToApply: string[] = ['COMPLETED'],
        itemsToDeliver: string[] = []
    ) => {
        startTransition(async () => {
            setError(null);
            
            const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
            const remainingBalance = isLayaway ? total - downPayment : 0;
            
            const payload: SalePayload = {
                cartItems: cart.map(item => ({ inventory_id: item.inventory_id, quantity: item.quantity, price_at_sale: item.price })),
                paymentMethod, 
                subtotal, 
                discountAmount: discount, 
                discountReason: discount > 0 ? 'Descuento en POS' : '', 
                total, 
                requiresInvoice,
                specialOrderData: { isSpecialOrder, ...specialOrderDetails },
                isLayaway,
                downPayment,
                remainingBalance
            };
            
            const result = await processSaleAction(payload);
            console.log('📋 Resultado venta:', result.success ? 'ÉXITO' : 'ERROR');
            
            if (result.success && result.orderId) {
                // Aplicar los estados seleccionados a la orden creada
                if (statusesToApply.length > 0) {
                    await updateOrderMultipleStatuses(result.orderId, statusesToApply, 'pos_user');
                    console.log('🎯 Estados aplicados:', statusesToApply.join(', '));
                }
                
                // Actualizar el estado de entrega de los items
                if (itemsToDeliver.length > 0) {
                    try {
                        // Marcar todos como no entregados primero
                        await updateAllItemsDeliveryStatus(result.orderId, false);
                        
                        // Luego marcar los seleccionados como entregados
                        for (const inventoryId of itemsToDeliver) {
                            await updateItemDeliveryByInventoryId(result.orderId, inventoryId, true);
                        }
                        
                        console.log(`📦 Items marcados como entregados: ${itemsToDeliver.length}/${cart.length}`);
                    } catch (error) {
                        console.error('Error updating item delivery:', error);
                        setError('Error al actualizar el estado de entrega de los items');
                        return;
                    }
                }
                
                // Limpiar estados y redirigir
                setCart([]);
                setIsSpecialOrder(false);
                setRequiresInvoice(false);
                setSpecialOrderDetails({});
                
                router.push(`/admin/orders/${result.orderId}`);
            } else {
                setError(result.message || "Ocurrió un error al procesar la venta.");
            }
        });
    };

    // --- Funciones para Items Entregados ---
    const handleItemDeliveryToggle = (inventoryId: string) => {
        setDeliveredItems(prev => {
            if (prev.includes(inventoryId)) {
                return prev.filter(id => id !== inventoryId);
            } else {
                return [...prev, inventoryId];
            }
        });
    };

    const handleSelectAllItems = () => {
        const allItemIds = cart.map(item => item.inventory_id);
        setDeliveredItems(allItemIds);
    };

    const handleDeselectAllItems = () => {
        setDeliveredItems([]);
    };

    const handleSpecialOrderDetailsSave = (details: SpecialOrderDetails) => {
        console.log('💾 Guardando detalles especiales:', details.customerName);
        setSpecialOrderDetails(details);
        
        // Si hay un pago pendiente, inmediatamente volver a mostrar el modal de estados
        if (pendingPaymentData) {
            console.log('🔄 Reabriendo modal de estados...');
            // Pequeño delay para permitir que el modal de detalles se cierre primero
            setTimeout(() => {
                const defaultStatuses = [];
                if (pendingPaymentData.isLayaway) {
                    defaultStatuses.push('PENDING_PAYMENT');
                }
                if (details.embroideryNotes) {
                    defaultStatuses.push('PENDING_EMBROIDERY');
                }
                if (defaultStatuses.length === 0) {
                    defaultStatuses.push('COMPLETED');
                }
                
                setSelectedStatuses(defaultStatuses);
                setShowStatusModal(true);
            }, 100);
        }
    };
    
    // State para Pedidos Especiales y Facturas
    const [requiresInvoice, setRequiresInvoice] = useState(false);
    const [isSpecialOrder, setIsSpecialOrder] = useState(false);
    const [specialOrderDetails, setSpecialOrderDetails] = useState<SpecialOrderDetails>({});

    // --- Hidratación del Cliente ---
    useEffect(() => {
        setIsHydrated(true);
    }, []);

    // --- Detección de Dispositivo ---
    useEffect(() => {
        if (!isHydrated) return;
        
        const checkDeviceType = () => {
            // Cambiamos el threshold para ser más responsive
            const width = window.innerWidth;
            
            // Si es muy ancho (desktop) o pantalla muy pequeña, usar desktop view que es más responsive
            if (width >= 1200 || width < 768) {
                setViewMode('desktop');
            } else {
                setViewMode('tablet');
            }
        };
        checkDeviceType();
        window.addEventListener('resize', checkDeviceType);
        return () => window.removeEventListener('resize', checkDeviceType);
    }, [isHydrated]);

    // --- Carga de Datos Inicial ---
    useEffect(() => {
        if (!isHydrated) return;
        
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                const productData = await getGroupedProducts();
                setProducts(productData);
                const schoolData = await getSchools();
                setSchools(schoolData);
            } catch (error) {
                console.error('Error loading initial data:', error);
                setError('Error cargando datos iniciales');
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, [isHydrated]);

    // --- Handlers Compartidos ---
    // --- UseEffect para manejar la reapertura automática del modal ---
    // REMOVIDO: Usando enfoque más simple con setTimeout

    const handleAddToCart = (itemToAdd: CartItem) => {
        setCart(currentCart => {
            const existingItem = currentCart.find(item => item.inventory_id === itemToAdd.inventory_id);
            if (existingItem) return currentCart.map(item => item.inventory_id === itemToAdd.inventory_id ? { ...item, quantity: item.quantity + 1 } : item);
            return [...currentCart, { ...itemToAdd, quantity: 1 }];
        });
    };
    
    const handleUpdateQuantity = (inventoryId: string, newQuantity: number) => {
        if (newQuantity <= 0) setCart(currentCart => currentCart.filter(item => item.inventory_id !== inventoryId));
        else setCart(currentCart => currentCart.map(item => item.inventory_id === inventoryId ? { ...item, quantity: newQuantity } : item));
    };

    const handleProcessSale = (paymentMethod: string, discount: number, total: number, isLayaway: boolean = false, downPayment: number = 0) => {
        console.log('🚀 Iniciando venta -', paymentMethod, 'Total:', total, isLayaway ? 'SEPARADO' : '', isSpecialOrder ? 'ESPECIAL' : '');
        
        // Verificaciones previas
        if (cart.length === 0) { 
            setError("El carrito está vacío."); 
            return; 
        }
        
        if (isSpecialOrder && !specialOrderDetails.customerName) { 
            // Necesitamos los detalles del pedido especial primero
            setError("Completa los detalles del pedido especial primero."); 
            setPendingPaymentData({ paymentMethod, discount, total, isLayaway, downPayment });
            return; 
        }
        
        if (isLayaway && downPayment <= 0) { 
            setError("El anticipo debe ser mayor a $0 para separados."); 
            return; 
        }
        
        if (isLayaway && downPayment > total) { 
            setError("El anticipo no puede ser mayor al total."); 
            return; 
        }
        
        // Guardar datos del pago y mostrar modal de estados
        setPendingPaymentData({ paymentMethod, discount, total, isLayaway, downPayment });
        
        // Preseleccionar estados apropiados
        const defaultStatuses = [];
        if (isLayaway) {
            defaultStatuses.push('PENDING_PAYMENT');
        }
        if (isSpecialOrder && specialOrderDetails.embroideryNotes) {
            defaultStatuses.push('PENDING_EMBROIDERY');
        }
        if (defaultStatuses.length === 0) {
            defaultStatuses.push('COMPLETED');
        }
        
        // Preseleccionar todos los items como entregados por defecto
        const allItemIds = cart.map(item => item.inventory_id);
        setDeliveredItems(allItemIds);
        
        console.log('🎯 Estados preseleccionados:', defaultStatuses);
        setSelectedStatuses(defaultStatuses);
        setShowStatusModal(true);
    };

    // --- Renderizado Condicional ---
    if (!isHydrated || isLoading || viewMode === 'loading') {
        return <div className="flex items-center justify-center h-screen bg-gray-100"><p className="text-xl font-semibold">Cargando Punto de Venta...</p></div>;
    }

    const sharedProps = {
        cart, schools, specialOrderDetails, handleAddToCart, handleUpdateQuantity, handleProcessSale,
        isProcessing, requiresInvoice, setRequiresInvoice, isSpecialOrder, setIsSpecialOrder,
        handleSpecialOrderDetailsSave, hasPendingPayment: !!pendingPaymentData, error, setError,
    };

    if (viewMode === 'tablet') {
        return (
            <>
                <TabletPosView {...sharedProps} products={products} />
                {showStatusModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl border border-gray-200/50 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                            <h2 className="text-lg font-medium mb-4 text-black">Configurar Estados de la Orden</h2>
                            <p className="text-sm text-gray-600 mb-4">
                                Selecciona los estados que aplicarán a esta orden:
                            </p>
                            
                            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                                {availableStatuses.map((status) => {
                                    const isSelected = selectedStatuses.includes(status.key);
                                    
                                    return (
                                        <div key={status.key} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                                            <label className="flex items-start space-x-3 cursor-pointer flex-1">
                                                <div className="flex-shrink-0 mt-0.5">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleStatusToggle(status.key)}
                                                        className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="font-medium text-gray-900 text-sm">
                                                            {status.label}
                                                        </span>
                                                        {isSelected && <StatusBadge status={status.key} />}
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {status.description}
                                                    </p>
                                                </div>
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Sección de Items Entregados */}
                            <div className="border-t pt-6 mt-6">
                                <h3 className="text-base font-medium mb-3 text-black">Items Entregados</h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    Selecciona los items que fueron entregados al cliente:
                                </p>
                                
                                {/* Botones de Selección Rápida */}
                                <div className="flex gap-2 mb-4">
                                    <button
                                        onClick={handleSelectAllItems}
                                        className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full hover:bg-green-200 transition-colors"
                                    >
                                        Todos
                                    </button>
                                    <button
                                        onClick={handleDeselectAllItems}
                                        className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded-full hover:bg-red-200 transition-colors"
                                    >
                                        Ninguno
                                    </button>
                                </div>
                                
                                {/* Lista Compacta de Items */}
                                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                                    {cart.map((item) => {
                                        const isDelivered = deliveredItems.includes(item.inventory_id);
                                        
                                        return (
                                            <div key={item.inventory_id} className="flex items-center space-x-2 p-2 rounded-lg border hover:bg-gray-50 transition-colors">
                                                <label className="flex items-center space-x-2 cursor-pointer flex-1">
                                                    <div className="flex-shrink-0">
                                                        <input
                                                            type="checkbox"
                                                            checked={isDelivered}
                                                            onChange={() => handleItemDeliveryToggle(item.inventory_id)}
                                                            className="rounded border-gray-300 text-green-600 shadow-sm focus:border-green-300 focus:ring focus:ring-green-200 focus:ring-opacity-50"
                                                        />
                                                    </div>
                                                    <div className="flex-shrink-0">
                                                        <Image 
                                                            src={item.image_url || '/placeholder.jpg'} 
                                                            alt={item.product_name} 
                                                            width={32} 
                                                            height={32} 
                                                            className="w-8 h-8 object-cover rounded-md bg-gray-200" 
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center space-x-2">
                                                            <p className="font-medium text-gray-900 text-xs truncate">
                                                                {item.product_name}
                                                            </p>
                                                            {isDelivered && (
                                                                <span className="inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                    ✓
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                            <span>{item.size}</span>
                                                            <span>•</span>
                                                            <span>{item.color}</span>
                                                            <span>•</span>
                                                            <span>Cant: {item.quantity}</span>
                                                        </div>
                                                    </div>
                                                </label>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Resumen de Items */}
                                <div className="bg-gray-50 rounded-lg p-2 mb-4">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-600">Items Entregados:</span>
                                        <span className="font-medium text-gray-900">{deliveredItems.length} de {cart.length}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setShowStatusModal(false);
                                        setPendingPaymentData(null);
                                        setSelectedStatuses([]);
                                        setDeliveredItems([]);
                                    }}
                                    className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                
                                {/* Botón especial para completar detalles si es necesario */}
                                {isSpecialOrder && !specialOrderDetails.customerName && (
                                    <button
                                        onClick={() => {
                                            setShowStatusModal(false);
                                            // Abrir modal de detalles especiales
                                            // Este se manejará por los componentes hijos
                                        }}
                                        className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors"
                                    >
                                        Completar Detalles
                                    </button>
                                )}
                                
                                <button
                                    onClick={handleConfirmStatusesAndProcess}
                                    disabled={selectedStatuses.length === 0 || (isSpecialOrder && !specialOrderDetails.customerName)}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isSpecialOrder && !specialOrderDetails.customerName ? 'Detalles Requeridos' : 'Procesar Venta'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }

    return (
        <>
            <DesktopPosView {...sharedProps} />
            {showStatusModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl border border-gray-200/50 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-lg font-medium mb-4 text-black">Configurar Estados de la Orden</h2>
                        <p className="text-sm text-gray-600 mb-4">
                            Selecciona los estados que aplicarán a esta orden:
                        </p>
                        
                        <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                            {availableStatuses.map((status) => {
                                const isSelected = selectedStatuses.includes(status.key);
                                
                                return (
                                    <div key={status.key} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                                        <label className="flex items-start space-x-3 cursor-pointer flex-1">
                                            <div className="flex-shrink-0 mt-0.5">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleStatusToggle(status.key)}
                                                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-medium text-gray-900 text-sm">
                                                        {status.label}
                                                    </span>
                                                    {isSelected && <StatusBadge status={status.key} />}
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {status.description}
                                                </p>
                                            </div>
                                        </label>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Sección de Items Entregados */}
                        <div className="border-t pt-6 mt-6">
                            <h3 className="text-base font-medium mb-3 text-black">Items Entregados</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Selecciona los items que fueron entregados al cliente:
                            </p>
                            
                            {/* Botones de Selección Rápida */}
                            <div className="flex gap-2 mb-4">
                                <button
                                    onClick={handleSelectAllItems}
                                    className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full hover:bg-green-200 transition-colors"
                                >
                                    Seleccionar Todos
                                </button>
                                <button
                                    onClick={handleDeselectAllItems}
                                    className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded-full hover:bg-red-200 transition-colors"
                                >
                                    Deseleccionar Todos
                                </button>
                            </div>
                            
                            {/* Lista de Items */}
                            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                                {cart.map((item) => {
                                    const isDelivered = deliveredItems.includes(item.inventory_id);
                                    
                                    return (
                                        <div key={item.inventory_id} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                                            <label className="flex items-center space-x-3 cursor-pointer flex-1">
                                                <div className="flex-shrink-0">
                                                    <input
                                                        type="checkbox"
                                                        checked={isDelivered}
                                                        onChange={() => handleItemDeliveryToggle(item.inventory_id)}
                                                        className="rounded border-gray-300 text-green-600 shadow-sm focus:border-green-300 focus:ring focus:ring-green-200 focus:ring-opacity-50"
                                                    />
                                                </div>
                                                <div className="flex-shrink-0">
                                                    <Image 
                                                        src={item.image_url || '/placeholder.jpg'} 
                                                        alt={item.product_name} 
                                                        width={40} 
                                                        height={40} 
                                                        className="w-10 h-10 object-cover rounded-md bg-gray-200" 
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-2">
                                                        <p className="font-medium text-gray-900 text-sm truncate">
                                                            {item.product_name}
                                                        </p>
                                                        {isDelivered && (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                ✓ Entregado
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center space-x-4 mt-1">
                                                        <span className="text-xs text-gray-500">
                                                            Talla: {item.size}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            Color: {item.color}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            Cantidad: {item.quantity}
                                                        </span>
                                                        <span className="text-xs font-medium text-gray-900">
                                                            ${(item.price * item.quantity).toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Resumen */}
                            <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Items Entregados:</span>
                                    <span className="font-medium text-gray-900">{deliveredItems.length} de {cart.length}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setShowStatusModal(false);
                                    setPendingPaymentData(null);
                                    setSelectedStatuses([]);
                                    setDeliveredItems([]);
                                }}
                                className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            
                            {/* Botón especial para completar detalles si es necesario */}
                            {isSpecialOrder && !specialOrderDetails.customerName && (
                                <button
                                    onClick={() => {
                                        setShowStatusModal(false);
                                        // Abrir modal de detalles especiales
                                        // Este se manejará por los componentes hijos
                                    }}
                                    className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors"
                                >
                                    Completar Detalles
                                </button>
                            )}
                            
                            <button
                                onClick={handleConfirmStatusesAndProcess}
                                disabled={selectedStatuses.length === 0 || (isSpecialOrder && !specialOrderDetails.customerName)}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                                {isSpecialOrder && !specialOrderDetails.customerName ? 'Detalles Requeridos' : 'Procesar Venta'}
                            </button>
                        </div>
                    </div>
                </div>
                )}
        </>
    );
}