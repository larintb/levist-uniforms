-- Verificación y corrección de funciones para el sistema de separado
-- Ejecuta estos comandos en el SQL Editor de Supabase

-- 1. Verificar que las columnas existen en la tabla orders
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('is_layaway', 'down_payment', 'remaining_balance');

-- 2. Verificar datos actuales de separados (si existen)
SELECT id, is_layaway, down_payment, remaining_balance, status, total 
FROM orders 
WHERE is_layaway = true;

-- 3. Crear/actualizar función para completar pago de separado
CREATE OR REPLACE FUNCTION public.complete_layaway_payment(
    p_order_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    order_record record;
    result json;
BEGIN
    -- Obtener información de la orden
    SELECT id, total, is_layaway, remaining_balance 
    INTO order_record
    FROM public.orders 
    WHERE id = p_order_id AND is_layaway = true;
    
    -- Verificar que la orden existe y es un separado
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'Orden no encontrada o no es un separado'
        );
    END IF;
    
    -- Verificar que aún hay saldo pendiente
    IF order_record.remaining_balance <= 0 THEN
        RETURN json_build_object(
            'success', false, 
            'message', 'Esta orden ya está completamente pagada'
        );
    END IF;
    
    -- Actualizar la orden como completamente pagada
    UPDATE public.orders 
    SET 
        down_payment = total,
        remaining_balance = 0,
        status = 'COMPLETED'
    WHERE id = p_order_id;
    
    RETURN json_build_object(
        'success', true, 
        'message', 'Pago de separado completado exitosamente'
    );
END;
$$;

-- 4. Verificar que la función process_sale tiene los parámetros correctos
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.proname = 'process_sale';

-- 5. Verificar que la vista full_order_details_view incluye los campos de separado
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'full_order_details_view' 
AND column_name IN ('is_layaway', 'down_payment', 'remaining_balance');

-- 6. Crear función para actualizar estado de orden (si no existe)
CREATE OR REPLACE FUNCTION public.update_order_status(
    p_order_id uuid,
    p_new_status text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Actualizar el estado de la orden
    UPDATE public.orders
    SET status = p_new_status
    WHERE id = p_order_id;
    
    -- Verificar que se actualizó
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Orden no encontrada con ID: ' || p_order_id
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Estado de la orden actualizado exitosamente'
    );
END;
$$;

-- 7. Otorgar permisos necesarios
GRANT EXECUTE ON FUNCTION public.complete_layaway_payment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_order_status(uuid, text) TO authenticated;

-- 8. Verificar permisos en la tabla orders
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'orders' AND grantee = 'authenticated';
