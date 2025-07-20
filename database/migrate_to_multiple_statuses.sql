-- Migración a Sistema de Estados Múltiples
-- Permite que una orden tenga varios estados activos simultáneamente

-- 1. Crear tabla para estados múltiples
CREATE TABLE IF NOT EXISTS order_statuses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(255),
    notes TEXT
);

-- 2. Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_order_statuses_order_id ON order_statuses(order_id);
CREATE INDEX IF NOT EXISTS idx_order_statuses_status ON order_statuses(status);
CREATE INDEX IF NOT EXISTS idx_order_statuses_active ON order_statuses(is_active);

-- 3. Migrar datos existentes del campo 'status' a la nueva tabla
INSERT INTO order_statuses (order_id, status, is_active, created_at)
SELECT id, status, true, created_at
FROM orders
WHERE status IS NOT NULL;

-- 4. Vista actualizada que incluye múltiples estados
CREATE OR REPLACE VIEW full_order_details_with_statuses AS
SELECT 
    o.id as order_id,
    o.created_at as order_date,
    o.total as order_total,
    o.subtotal,
    o.discount_amount,
    o.discount_reason,
    o.customer_name,
    o.customer_phone,
    u.full_name as seller_name,
    o.payment_method,
    o.embroidery_notes,
    o.requires_invoice,
    s.name as school_name,
    o.is_layaway,
    o.down_payment,
    o.remaining_balance,
    oi.id as item_id,
    p.name as product_name,
    CONCAT(p.sku_base, '-', pv.color, '-', i.size) as sku,
    pv.color,
    i.size,
    oi.quantity,
    oi.price_at_sale,
    oi.delivered,
    -- Agregar estados activos como array
    COALESCE(
        (SELECT array_agg(os.status) 
         FROM order_statuses os 
         WHERE os.order_id = o.id AND os.is_active = true), 
        ARRAY[]::varchar[]
    ) as active_statuses
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
LEFT JOIN schools s ON o.school_id = s.id
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN inventory i ON oi.inventory_id = i.id
LEFT JOIN product_variants pv ON i.variant_id = pv.id
LEFT JOIN products p ON pv.product_id = p.id
ORDER BY o.created_at DESC;

-- 5. Funciones para manejar estados múltiples

-- Función para agregar un estado a una orden
CREATE OR REPLACE FUNCTION add_order_status(
    p_order_id UUID,
    p_status VARCHAR(50),
    p_created_by VARCHAR(255) DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    -- Verificar si el estado ya existe y está activo
    SELECT EXISTS(
        SELECT 1 FROM order_statuses 
        WHERE order_id = p_order_id 
        AND status = p_status 
        AND is_active = true
    ) INTO v_exists;
    
    IF v_exists THEN
        RETURN json_build_object(
            'success', false,
            'message', 'El estado ' || p_status || ' ya está activo para esta orden'
        );
    END IF;
    
    -- Insertar el nuevo estado
    INSERT INTO order_statuses (order_id, status, is_active, created_by, notes)
    VALUES (p_order_id, p_status, true, p_created_by, p_notes);
    
    RETURN json_build_object(
        'success', true,
        'message', 'Estado ' || p_status || ' agregado exitosamente'
    );
END;
$$ LANGUAGE plpgsql;

-- Función para remover un estado de una orden
CREATE OR REPLACE FUNCTION remove_order_status(
    p_order_id UUID,
    p_status VARCHAR(50)
) RETURNS JSON AS $$
BEGIN
    -- Marcar el estado como inactivo
    UPDATE order_statuses 
    SET is_active = false, updated_at = NOW()
    WHERE order_id = p_order_id 
    AND status = p_status 
    AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Estado ' || p_status || ' no encontrado o ya inactivo'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Estado ' || p_status || ' removido exitosamente'
    );
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar múltiples estados de una orden
CREATE OR REPLACE FUNCTION update_order_statuses(
    p_order_id UUID,
    p_statuses VARCHAR(50)[],
    p_created_by VARCHAR(255) DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_status VARCHAR(50);
    v_current_statuses VARCHAR(50)[];
    v_to_add VARCHAR(50)[];
    v_to_remove VARCHAR(50)[];
BEGIN
    -- Obtener estados activos actuales
    SELECT array_agg(status) INTO v_current_statuses
    FROM order_statuses 
    WHERE order_id = p_order_id AND is_active = true;
    
    IF v_current_statuses IS NULL THEN
        v_current_statuses := ARRAY[]::varchar[];
    END IF;
    
    -- Determinar qué estados agregar
    SELECT array_agg(status) INTO v_to_add
    FROM unnest(p_statuses) AS status
    WHERE status != ALL(v_current_statuses);
    
    -- Determinar qué estados remover
    SELECT array_agg(status) INTO v_to_remove
    FROM unnest(v_current_statuses) AS status
    WHERE status != ALL(p_statuses);
    
    -- Agregar nuevos estados
    IF v_to_add IS NOT NULL THEN
        FOREACH v_status IN ARRAY v_to_add
        LOOP
            INSERT INTO order_statuses (order_id, status, is_active, created_by)
            VALUES (p_order_id, v_status, true, p_created_by);
        END LOOP;
    END IF;
    
    -- Remover estados desactivados
    IF v_to_remove IS NOT NULL THEN
        FOREACH v_status IN ARRAY v_to_remove
        LOOP
            UPDATE order_statuses 
            SET is_active = false, updated_at = NOW()
            WHERE order_id = p_order_id AND status = v_status AND is_active = true;
        END LOOP;
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Estados actualizados exitosamente',
        'added', v_to_add,
        'removed', v_to_remove
    );
END;
$$ LANGUAGE plpgsql;

-- 6. Lógica especial para estados mutuamente excluyentes
-- COMPLETED desactiva todos los otros estados excepto DELIVERED
CREATE OR REPLACE FUNCTION handle_completed_status(p_order_id UUID) RETURNS JSON AS $$
BEGIN
    -- Si se activa COMPLETED, desactivar todos menos DELIVERED
    UPDATE order_statuses 
    SET is_active = false, updated_at = NOW()
    WHERE order_id = p_order_id 
    AND status NOT IN ('COMPLETED', 'DELIVERED') 
    AND is_active = true;
    
    RETURN json_build_object('success', true, 'message', 'Orden marcada como completada');
END;
$$ LANGUAGE plpgsql;

-- Trigger para manejar lógica especial de estados
CREATE OR REPLACE FUNCTION trigger_order_status_logic() RETURNS TRIGGER AS $$
BEGIN
    -- Si se está insertando COMPLETED, ejecutar lógica especial
    IF NEW.status = 'COMPLETED' AND NEW.is_active = true THEN
        PERFORM handle_completed_status(NEW.order_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_status_logic_trigger
    AFTER INSERT ON order_statuses
    FOR EACH ROW
    EXECUTE FUNCTION trigger_order_status_logic();
