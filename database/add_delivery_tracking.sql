-- SQL para añadir funcionalidad de seguimiento de entrega de ítems
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. Añadir columna 'delivered' a la tabla order_items
ALTER TABLE "public"."order_items"
ADD COLUMN IF NOT EXISTS "delivered" BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Función para actualizar el estado de entrega de un ítem específico
CREATE OR REPLACE FUNCTION public.update_item_delivery_status(
    p_item_id uuid,
    p_delivered boolean
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Actualizar el estado de entrega del ítem
    UPDATE public.order_items
    SET delivered = p_delivered
    WHERE id = p_item_id;
    
    -- Si no se encuentra el ítem, devolver error
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'Ítem no encontrado con ID: ' || p_item_id
        );
    END IF;
    
    -- Devolver éxito
    RETURN json_build_object(
        'success', true, 
        'message', 'Estado de entrega actualizado correctamente'
    );
END;
$$;

-- 3. Función para marcar todos los ítems de una orden como entregados/no entregados
CREATE OR REPLACE FUNCTION public.update_all_items_delivery_status(
    p_order_id uuid,
    p_delivered boolean
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    items_count integer;
BEGIN
    -- Actualizar el estado de entrega de todos los ítems de la orden
    UPDATE public.order_items
    SET delivered = p_delivered
    WHERE order_id = p_order_id;
    
    -- Obtener el número de ítems actualizados
    GET DIAGNOSTICS items_count = ROW_COUNT;
    
    -- Si no se encontraron ítems, devolver error
    IF items_count = 0 THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'No se encontraron ítems para la orden: ' || p_order_id
        );
    END IF;
    
    -- Devolver éxito con el conteo
    RETURN json_build_object(
        'success', true, 
        'message', 'Estado de entrega actualizado para ' || items_count || ' ítem(s)'
    );
END;
$$;

-- 4. Actualizar la vista para incluir el estado de entrega
DROP VIEW IF EXISTS public.full_order_details_view;

CREATE VIEW public.full_order_details_view AS
SELECT
    o.id AS order_id,
    o.created_at AS order_date,
    o.total AS order_total,
    o.status AS order_status,
    o.subtotal,
    o.discount_amount,
    o.discount_reason,
    o.customer_name,
    o.customer_phone,
    o.payment_method,
    o.embroidery_notes,
    o.requires_invoice,
    o.is_layaway,
    o.down_payment,
    o.remaining_balance,
    u.full_name AS seller_name,
    s.name AS school_name,
    oi.id AS item_id,
    p.name AS product_name,
    p.sku_base AS sku,
    pv.color,
    i.size,
    oi.quantity,
    oi.price_at_sale,
    oi.delivered
FROM
    public.orders o
JOIN
    public.order_items oi ON o.id = oi.order_id
JOIN
    public.inventory i ON oi.inventory_id = i.id
JOIN
    public.product_variants pv ON i.variant_id = pv.id
JOIN
    public.products p ON pv.product_id = p.id
LEFT JOIN
    public.users u ON o.user_id = u.id
LEFT JOIN
    public.schools s ON o.school_id = s.id;
