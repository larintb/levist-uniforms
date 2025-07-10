-- SCRIPT DE PRUEBA RÁPIDA - Ejecutar en Supabase SQL Editor
-- Este script crea las funciones mínimas necesarias para el sistema de separado

-- 1. Función para completar pago de separado
CREATE OR REPLACE FUNCTION public.complete_layaway_payment(
    p_order_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    order_record record;
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

-- 2. Eliminar y recrear función para actualizar estado de orden
DROP FUNCTION IF EXISTS public.update_order_status(uuid, text);

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

-- 3. Otorgar permisos
GRANT EXECUTE ON FUNCTION public.complete_layaway_payment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_order_status(uuid, text) TO authenticated;

-- 4. Test query - Ejecutar para verificar que todo funciona
-- (Reemplaza el UUID con un ID real de una orden separado en tu base de datos)
-- SELECT public.complete_layaway_payment('pon-aqui-un-uuid-real');

-- 5. Verificar estructura de la tabla orders
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('is_layaway', 'down_payment', 'remaining_balance')
ORDER BY column_name;

-- 6. Consultar órdenes separado existentes (si las hay)
SELECT 
    id,
    customer_name,
    total,
    down_payment,
    remaining_balance,
    status,
    created_at
FROM orders 
WHERE is_layaway = true
ORDER BY created_at DESC
LIMIT 10;

-- 7. Verificar que las funciones se crearon correctamente
SELECT 
    proname as function_name,
    pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE proname IN ('complete_layaway_payment', 'update_order_status')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 8. Test manual de la función (descomenta y usa un UUID real)
-- SELECT public.complete_layaway_payment('UUID-DE-UNA-ORDEN-SEPARADO-AQUI');

-- 9. QUERIES DE PRUEBA DESPUÉS DE CREAR UN SEPARADO
-- Ejecuta estas queries después de crear un separado en el POS:

-- Ver todas las órdenes separado con saldo pendiente
SELECT 
    id,
    customer_name,
    total,
    down_payment,
    remaining_balance,
    status,
    is_layaway,
    created_at
FROM orders 
WHERE is_layaway = true AND remaining_balance > 0
ORDER BY created_at DESC;

-- 10. TEST DE LA FUNCIÓN complete_layaway_payment
-- Copia un UUID de la query anterior y úsalo aquí:
-- SELECT public.complete_layaway_payment('PEGA-AQUI-EL-UUID-DE-UNA-ORDEN-SEPARADO');

-- 11. Verificar que la función funcionó
-- Después de ejecutar la función anterior, ejecuta esto para verificar el cambio:
-- SELECT 
--     id,
--     customer_name,
--     total,
--     down_payment,
--     remaining_balance,
--     status,
--     is_layaway
-- FROM orders 
-- WHERE id = 'PEGA-AQUI-EL-MISMO-UUID';

-- 12. Ver el log de la vista full_order_details_view
SELECT 
    order_id,
    customer_name,
    order_total,
    order_status,
    is_layaway,
    down_payment,
    remaining_balance
FROM full_order_details_view 
WHERE is_layaway = true
ORDER BY order_date DESC
LIMIT 5;
