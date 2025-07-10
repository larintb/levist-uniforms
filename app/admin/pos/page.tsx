// @/app/admin/pos/page.tsx
"use client";

import React, { useState, useEffect, useMemo, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getGroupedProducts, processSaleAction, SalePayload, GroupedProduct, ProductColorVariant, ProductVariant, getSchools, findProductByBarcode } from './actions';
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
    setSpecialOrderDetails: React.Dispatch<React.SetStateAction<SpecialOrderDetails>>;
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

const TabletPosView: React.FC<TabletPosViewProps> = ({ cart, schools, products, handleAddToCart, handleUpdateQuantity, handleProcessSale, isProcessing, requiresInvoice, setRequiresInvoice, isSpecialOrder, setIsSpecialOrder, setSpecialOrderDetails, error }) => {
    const [selectedProduct, setSelectedProduct] = useState<GroupedProduct | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredProducts, setFilteredProducts] = useState<GroupedProduct[]>(products);
    const [isSpecialOrderModalOpen, setSpecialOrderModalOpen] = useState(false);

    useEffect(() => {
        const result = products.filter(p => p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku_base.toLowerCase().includes(searchTerm.toLowerCase()));
        setFilteredProducts(result);
    }, [searchTerm, products]);

    return (
        <div className="h-screen w-screen flex font-sans antialiased text-gray-900 overflow-hidden">
            <div className="w-1/3 max-w-lg h-full flex-shrink-0 border-r border-gray-200">
                <PosCart items={cart} onUpdateQuantity={handleUpdateQuantity} onProcessSale={handleProcessSale} isProcessing={isProcessing} requiresInvoice={requiresInvoice} setRequiresInvoice={setRequiresInvoice} isSpecialOrder={isSpecialOrder} setIsSpecialOrder={setIsSpecialOrder} onOpenSpecialOrderModal={() => setSpecialOrderModalOpen(true)} />
            </div>
            <div className="flex-1 h-full flex flex-col bg-gray-50">
                <div className="p-4 bg-gray-50 sticky top-0 z-10 border-b border-gray-200"><input type="text" placeholder="Buscar por nombre o SKU..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-4 text-lg border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/></div>
                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredProducts.map(product => (
                        <button key={product.sku_base} onClick={() => setSelectedProduct(product)} className="bg-white rounded-2xl shadow-md p-4 text-center flex flex-col justify-between items-center hover:ring-2 hover:ring-indigo-500 transition-all duration-200">
                            <Image src={product.colors[0]?.image_url || '/placeholder.jpg'} alt={product.product_name} width={300} height={300} className="w-full h-32 object-cover rounded-lg mb-4" />
                            <div className="flex-1"><p className="font-bold text-gray-800">{product.product_name}</p></div>
                            <p className="mt-2 text-sm text-gray-500">{product.colors.length} colores</p>
                        </button>
                    ))}
                </div>
            </div>
            {selectedProduct && <VariantSelectionModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onAddToCart={handleAddToCart} />}
            <SpecialOrderModal isOpen={isSpecialOrderModalOpen} onClose={() => setSpecialOrderModalOpen(false)} onSave={setSpecialOrderDetails} schools={schools} />
            {error && <div className="absolute bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50"><strong className="font-bold">Error: </strong><span className="block sm:inline">{error}</span></div>}
        </div>
    );
};

// --- Componente: Carrito de Compra (Compartido) ---
const PosCart = ({ items, onUpdateQuantity, onProcessSale, isProcessing, requiresInvoice, setRequiresInvoice, isSpecialOrder, setIsSpecialOrder, onOpenSpecialOrderModal }: { items: CartItem[], onUpdateQuantity: (inventoryId: string, newQuantity: number) => void, onProcessSale: (paymentMethod: string, discount: number, total: number, isLayaway?: boolean, downPayment?: number) => void, isProcessing: boolean, requiresInvoice: boolean, setRequiresInvoice: (value: boolean) => void, isSpecialOrder: boolean, setIsSpecialOrder: (value: boolean) => void, onOpenSpecialOrderModal: () => void }) => {
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
            onOpenSpecialOrderModal();
        }
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

    return (
        <div className="bg-white h-full flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-200"><h2 className="text-2xl font-bold text-gray-900">Venta Actual</h2></div>
            <ul className="flex-1 overflow-y-auto p-4 divide-y divide-gray-200">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center text-gray-400 h-full p-8"><ShoppingBagIcon className="h-20 w-20 mb-4"/><p className="font-medium">El carrito está vacío</p><p className="text-sm">Agrega productos</p></div>
                ) : (
                    items.map(item => (
                        <li key={item.inventory_id} className="py-4 flex items-center space-x-4">
                            <Image src={item.image_url || '/placeholder.jpg'} alt={item.product_name} width={64} height={64} className="w-16 h-16 object-cover rounded-lg bg-gray-200" />
                            <div className="flex-1"><p className="font-semibold text-gray-800">{item.product_name}</p><p className="text-sm text-gray-600">{item.size} / {item.color}</p></div>
                            <div className="flex items-center space-x-3">
                                <button onClick={() => handleQuantityChange(item.inventory_id, -1)} className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"><MinusIcon className="h-5 w-5" /></button>
                                <span className="font-bold text-lg w-8 text-center">{item.quantity}</span>
                                <button onClick={() => handleQuantityChange(item.inventory_id, 1)} className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"><PlusIcon className="h-5 w-5" /></button>
                            </div>
                        </li>
                    ))
                )}
            </ul>
            <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="space-y-4 mb-6">
                    <button onClick={() => setRequiresInvoice(!requiresInvoice)} className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"><span className="font-semibold text-gray-800">¿Requiere Factura?</span><CheckboxIcon checked={requiresInvoice} /></button>
                    <button onClick={handleSpecialOrderToggle} className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"><span className="font-semibold text-gray-800">¿Es Pedido Especial?</span><CheckboxIcon checked={isSpecialOrder} /></button>
                    <button onClick={handleLayawayToggle} className="w-full flex items-center justify-between p-4 rounded-xl bg-blue-100 hover:bg-blue-200 transition-colors"><span className="font-semibold text-gray-800">¿Es Separado?</span><CheckboxIcon checked={isLayaway} /></button>
                </div>
                <div className="space-y-3 text-lg">
                    <div className="text-black flex justify-between font-medium"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                    <div className="text-black flex justify-between items-center"><label htmlFor="discount" className="font-medium">Descuento</label><input id="discount" type="number" value={discount} onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))} className="w-28 p-2 text-right font-bold border border-gray-300 rounded-lg"/></div>
                    {requiresInvoice && <div className="flex justify-between text-gray-600"><span>IVA (16%)</span><span>${iva.toFixed(2)}</span></div>}
                    <div className="flex justify-between text-2xl font-bold text-gray-900 border-t pt-3 mt-3"><span>TOTAL</span><span>${total.toFixed(2)}</span></div>
                    
                    {isLayaway && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-3">
                            <h4 className="font-semibold text-blue-900">Detalles del Separado</h4>
                            <div className="flex justify-between items-center">
                                <label htmlFor="downPayment" className="font-medium text-blue-800">Anticipo</label>
                                <input 
                                    id="downPayment" 
                                    type="number" 
                                    value={downPayment} 
                                    onChange={(e) => handleDownPaymentChange(parseFloat(e.target.value) || 0)} 
                                    className="w-28 p-2 text-right font-bold border border-blue-300 rounded-lg"
                                    max={total}
                                    min={0}
                                    step="0.01"
                                />
                            </div>
                            <div className="flex justify-between text-blue-800">
                                <span>Saldo Pendiente:</span>
                                <span className="font-bold">${remainingBalance.toFixed(2)}</span>
                            </div>
                            {downPayment <= 0 && (
                                <p className="text-red-600 text-sm font-medium">⚠️ El anticipo debe ser mayor a $0</p>
                            )}
                            {downPayment >= total && (
                                <p className="text-green-600 text-sm font-medium">✅ Pago completo</p>
                            )}
                        </div>
                    )}
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => onProcessSale('Efectivo', discount, total, isLayaway, downPayment)} 
                        disabled={isProcessing || items.length === 0 || (isLayaway && downPayment <= 0)} 
                        className="w-full p-4 text-lg font-bold text-white bg-indigo-600 rounded-xl shadow-md hover:bg-indigo-700 disabled:bg-gray-400"
                    >
                        Efectivo
                    </button>
                    <button 
                        onClick={() => onProcessSale('Tarjeta', discount, total, isLayaway, downPayment)} 
                        disabled={isProcessing || items.length === 0 || (isLayaway && downPayment <= 0)} 
                        className="w-full p-4 text-lg font-bold text-white bg-indigo-500 rounded-xl shadow-md hover:bg-indigo-600 disabled:bg-gray-400"
                    >
                        Tarjeta
                    </button>
                </div>
                {isProcessing && <p className="text-center mt-4 text-gray-800 font-medium">Procesando venta...</p>}
            </div>
        </div>
    );
};

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl p-8 m-4 max-w-md w-full" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{product.product_name}</h2>
                <div className="mb-6"><h3 className="text-lg font-semibold text-gray-800 mb-3">Color</h3><div className="flex flex-wrap gap-3">{product.colors.map(color => (<button key={color.color} onClick={() => setSelectedColor(color)} className={`p-2 rounded-lg border-2 transition-all ${selectedColor?.color === color.color ? 'border-indigo-600 ring-2 ring-indigo-300' : 'border-gray-200'}`}><Image src={color.image_url || '/placeholder.jpg'} alt={color.color} width={80} height={80} className="w-20 h-20 object-cover rounded-md" /><p className="text-sm font-medium mt-1 text-center">{color.color}</p></button>))}</div></div>
                {selectedColor && <div className="mb-8"><h3 className="text-lg font-semibold text-gray-800 mb-3">Talla</h3><div className="flex flex-wrap gap-3">{selectedColor.variants.map(variant => (<button key={variant.inventory_id} onClick={() => setSelectedVariant(variant)} className={`px-6 py-3 rounded-full text-base font-bold transition-colors ${selectedVariant?.inventory_id === variant.inventory_id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}>{variant.size}</button>))}</div></div>}
                <button onClick={handleAddToCart} disabled={!selectedVariant} className="w-full p-4 text-xl font-bold text-white bg-indigo-600 rounded-xl shadow-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed">Agregar al Carrito</button>
            </div>
        </div>
    );
};

// --- Componente: Modal de Pedido Especial (Compartido) ---
const SpecialOrderModal = ({ isOpen, onClose, onSave, schools }: { isOpen: boolean, onClose: () => void, onSave: (details: SpecialOrderDetails) => void, schools: School[] }) => {
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [schoolId, setSchoolId] = useState<string | null>(null);
    const [embroideryNotes, setEmbroideryNotes] = useState('');

    if (!isOpen) return null;

    const handleSave = () => {
        onSave({ customerName, customerPhone, schoolId, embroideryNotes });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-lg md:max-w-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Detalles del Pedido Especial</h2>
                <div className="space-y-5">
                    <div><label htmlFor="customerName" className="block text-sm md:text-base font-semibold text-gray-700 mb-1">Nombre Completo del Cliente*</label><input type="text" id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="text-gray-700 w-full p-3 text-base border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Ej. Juan Pérez"/></div>
                    <div><label htmlFor="customerPhone" className="block text-sm md:text-base font-semibold text-gray-700 mb-1">Teléfono de Contacto</label><input type="tel" id="customerPhone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="text-gray-700 w-full p-3 text-base border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Ej. 868-123-4567"/></div>
                    <div><label htmlFor="schoolId" className="block text-sm md:text-base font-semibold text-gray-700 mb-1">Escuela (Opcional)</label><select id="schoolId" value={schoolId ?? ''} onChange={(e) => setSchoolId(e.target.value || null)} className="text-gray-700 w-full p-3 text-base border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"><option value="">Ninguna</option>{schools.map(school => (<option key={school.id} value={school.id}>{school.name}</option>))}</select></div>
                    <div><label htmlFor="embroideryNotes" className="block text-sm md:text-base font-semibold text-gray-700 mb-1">Notas de Bordado / Pedido</label><textarea id="embroideryNotes" rows={4} value={embroideryNotes} onChange={(e) => setEmbroideryNotes(e.target.value)} className="text-gray-700 w-full p-3 text-base border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Ej. Bordar 'Dr. Juan Pérez' en la filipina."></textarea></div>
                </div>
                <div className="mt-8 flex justify-end gap-4"><button onClick={onClose} className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold text-base">Cancelar</button><button onClick={handleSave} className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold text-base">Guardar Detalles</button></div>
            </div>
        </div>
    );
};


// #########################################################################
// ############# VISTA PARA DESKTOP (DISEÑO ORIGINAL) ######################
// #########################################################################

const DesktopPosView: React.FC<DesktopPosViewProps> = ({ cart, schools, handleAddToCart, handleUpdateQuantity, handleProcessSale, isProcessing, requiresInvoice, setRequiresInvoice, isSpecialOrder, setIsSpecialOrder, setSpecialOrderDetails, error, setError }) => {
    const [isSpecialOrderModalOpen, setSpecialOrderModalOpen] = useState(false);
    const barcodeInputRef = useRef<HTMLInputElement>(null);
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
        <div className="flex flex-col md:flex-row h-screen bg-gray-100 font-sans">
            <div className="w-full md:w-1/3 bg-white p-6 shadow-lg flex flex-col">
                <PosCart items={cart} onUpdateQuantity={handleUpdateQuantity} onProcessSale={handleProcessSale} isProcessing={isProcessing} requiresInvoice={requiresInvoice} setRequiresInvoice={setRequiresInvoice} isSpecialOrder={isSpecialOrder} setIsSpecialOrder={setIsSpecialOrder} onOpenSpecialOrderModal={() => setSpecialOrderModalOpen(true)} />
            </div>
            <div className="w-full md:w-2/3 p-8">
                <div className="max-w-xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Punto de Venta</h1>
                    <p className="text-gray-700 mb-8 font-medium">Escanee un código de barras para añadirlo a la venta.</p>
                    <form onSubmit={handleSearchSubmit} className='mb-8'>
                        <div className="relative">
                            <input ref={barcodeInputRef} type="text" name="barcode" placeholder="Esperando código de barras..." className="text-gray-600 w-full pl-4 pr-16 py-4 text-lg bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" disabled={isBarcodeProcessing} autoComplete="off" />
                            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-indigo-600" disabled={isBarcodeProcessing}><SearchIcon className="h-7 w-7" /></button>
                        </div>
                    </form>
                    {isBarcodeProcessing && <p className="text-center mt-4 text-gray-800 font-medium">Buscando...</p>}
                    {error && <p className="text-center mt-4 text-red-700 font-semibold bg-red-100 p-4 rounded-lg border border-red-200">{error}</p>}
                </div>
            </div>
            <SpecialOrderModal isOpen={isSpecialOrderModalOpen} onClose={() => setSpecialOrderModalOpen(false)} onSave={setSpecialOrderDetails} schools={schools} />
        </div>
    );
};


// #########################################################################
// ############# COMPONENTE PRINCIPAL (ROUTER DE VISTAS) ###################
// #########################################################################

export default function PosPage() {
    const [viewMode, setViewMode] = useState<'loading' | 'desktop' | 'tablet'>('loading');
    
    // --- Estado Compartido ---
    const [cart, setCart] = useState<CartItem[]>([]);
    const [products, setProducts] = useState<GroupedProduct[]>([]);
    const [schools, setSchools] = useState<School[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    
    // State para Pedidos Especiales y Facturas
    const [requiresInvoice, setRequiresInvoice] = useState(false);
    const [isSpecialOrder, setIsSpecialOrder] = useState(false);
    const [specialOrderDetails, setSpecialOrderDetails] = useState<SpecialOrderDetails>({});

    // --- Detección de Dispositivo ---
    useEffect(() => {
        const checkDeviceType = () => {
            if (window.innerWidth < 1400) { // Umbral para tablets
                setViewMode('tablet');
            } else {
                setViewMode('desktop');
            }
        };
        checkDeviceType();
        window.addEventListener('resize', checkDeviceType);
        return () => window.removeEventListener('resize', checkDeviceType);
    }, []);

    // --- Carga de Datos Inicial ---
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            const productData = await getGroupedProducts();
            setProducts(productData);
            const schoolData = await getSchools();
            setSchools(schoolData);
            setIsLoading(false);
        };
        fetchInitialData();
    }, []);

    // --- Handlers Compartidos ---
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
        startTransition(async () => {
            setError(null);
            if (cart.length === 0) { setError("El carrito está vacío."); return; }
            if (isSpecialOrder && !specialOrderDetails.customerName) { setError("El nombre del cliente es obligatorio para pedidos especiales."); return; }
            if (isLayaway && downPayment <= 0) { setError("El anticipo debe ser mayor a $0 para separados."); return; }
            if (isLayaway && downPayment > total) { setError("El anticipo no puede ser mayor al total."); return; }
            
            const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
            const remainingBalance = isLayaway ? total - downPayment : 0;
            
            const payload: SalePayload = {
                cartItems: cart.map(item => ({ inventory_id: item.inventory_id, quantity: item.quantity, price_at_sale: item.price })),
                paymentMethod, subtotal, discountAmount: discount, discountReason: discount > 0 ? 'Descuento en POS' : '', total, requiresInvoice,
                specialOrderData: { isSpecialOrder, ...specialOrderDetails },
                isLayaway,
                downPayment,
                remainingBalance
            };
            const result = await processSaleAction(payload);
            if (result.success && result.orderId) {
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

    // --- Renderizado Condicional ---
    if (isLoading || viewMode === 'loading') {
        return <div className="flex items-center justify-center h-screen bg-gray-100"><p className="text-xl font-semibold">Cargando Punto de Venta...</p></div>;
    }

    const sharedProps = {
        cart, schools, specialOrderDetails, handleAddToCart, handleUpdateQuantity, handleProcessSale,
        isProcessing, requiresInvoice, setRequiresInvoice, isSpecialOrder, setIsSpecialOrder,
        setSpecialOrderDetails, error, setError,
    };

    if (viewMode === 'tablet') {
        return <TabletPosView {...sharedProps} products={products} />;
    }

    return <DesktopPosView {...sharedProps} />;
}
