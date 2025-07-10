-- SQL para configurar el sistema de apartados (Versión Corregida)
-- Por favor, ejecuta estos comandos en el SQL Editor de tu proyecto de Supabase.

-- 1. Añadir las nuevas columnas a la tabla 'orders'.
-- El script verifica si las columnas ya existen para evitar errores.
ALTER TABLE "public"."orders"
ADD COLUMN IF NOT EXISTS "is_layaway" BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "down_payment" NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "remaining_balance" NUMERIC NOT NULL DEFAULT 0;


-- 2. Actualizar la función RPC 'process_sale'.
-- Esta función reemplazará la existente para incluir la lógica de apartados.
CREATE OR REPLACE FUNCTION public.process_sale(
    p_cart_items jsonb,
    p_payment_method text,
    p_status text,
    p_customer_name text,
    p_customer_phone text,
    p_school_id uuid,
    p_embroidery_notes text,
    p_requires_invoice boolean,
    p_subtotal numeric,
    p_discount_amount numeric,
    p_discount_reason text,
    p_total numeric,
    p_is_layaway boolean,
    p_down_payment numeric,
    p_remaining_balance numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_order_id uuid;
    item record;
    auth_user_id uuid := auth.uid();
BEGIN
    -- Insertar la nueva orden con los datos del apartado
    INSERT INTO public.orders (
        user_id, payment_method, status, customer_name, customer_phone, school_id, 
        embroidery_notes, requires_invoice, subtotal, discount_amount, 
        discount_reason, total, is_layaway, down_payment, remaining_balance
    )
    VALUES (
        auth_user_id, p_payment_method, p_status, p_customer_name, p_customer_phone, p_school_id, 
        p_embroidery_notes, p_requires_invoice, p_subtotal, p_discount_amount, 
        p_discount_reason, p_total, p_is_layaway, p_down_payment, p_remaining_balance
    ) RETURNING id INTO new_order_id;

    -- Iterar sobre los ítems del carrito para insertarlos y actualizar el inventario
    FOR item IN SELECT * FROM jsonb_to_recordset(p_cart_items) AS x(inventory_id uuid, quantity integer, price_at_sale numeric)
    LOOP
        -- Insertar el ítem en la tabla de order_items
        INSERT INTO public.order_items (order_id, inventory_id, quantity, price_at_sale)
        VALUES (new_order_id, item.inventory_id, item.quantity, item.price_at_sale);

        -- Disminuir el stock del inventario
        UPDATE public.inventory
        SET stock = stock - item.quantity
        WHERE id = item.inventory_id;
    END LOOP;

    RETURN new_order_id;
END;
$$;


-- 3. Actualizar la vista 'full_order_details_view' para incluir los nuevos campos.
-- CORRECCIÓN: Se elimina la vista existente antes de crearla para evitar errores de columna.
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
    oi.price_at_sale
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

-- 4. Crear una función para actualizar el estado de órdenes con separado
CREATE OR REPLACE FUNCTION public.update_order_status(
    p_order_id uuid,
    p_new_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Actualizar el estado de la orden
    UPDATE public.orders
    SET status = p_new_status
    WHERE id = p_order_id;
    
    -- Si no se encuentra la orden, lanzar error
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Orden no encontrada con ID: %', p_order_id;
    END IF;
END;
$$;

-- 5. El estado PENDING_PAYMENT se maneja directamente en la columna 'status' de la tabla 'orders'
-- No requiere una tabla separada de estados, ya que se almacena como texto
