# Testing del Sistema de Separado - Guía de Pruebas

## Problemas Resueltos

### 1. **Problema**: El pago no se actualizaba correctamente
**Solución**: 
- Mejoré la función `completeLayawayPayment` para actualizar tanto `down_payment` como `remaining_balance`
- Agregué actualización forzada de datos después de completar el pago
- Mejoré el sistema de tiempo real para escuchar cambios en múltiples tablas

### 2. **Problema**: La interfaz no se refrescaba automáticamente
**Solución**:
- Agregué callback `onRefresh` al componente `OrderDetailColumn`
- Forzar `fetchOrders()` después de cada actualización exitosa
- Mejoré las suscripciones de tiempo real

## Pasos para Probar el Sistema

### A. Crear un Separado
1. Ve al POS (`/admin/pos`)
2. Agrega productos al carrito
3. Activa "¿Es Separado?"
4. Ingresa un anticipo (ej: $500 para un total de $1000)
5. Completa los datos del cliente
6. Procesa la venta con Efectivo/Tarjeta
7. **Verifica**: El recibo debe mostrar la información del separado

### B. Verificar el Estado del Separado
1. Ve a Órdenes (`/admin/orders`)
2. Filtra por "Pago Pendiente"
3. **Verifica**: La orden debe aparecer con estado "Pago Pendiente"
4. Selecciona la orden
5. **Verifica**: Debe mostrar:
   - Indicador "🏦 Separado"
   - Anticipo pagado en verde
   - Saldo pendiente en rojo

### C. Completar el Pago
1. En la orden del separado, haz clic en "Actualizar Estado"
2. Haz clic en "✅ Marcar como Totalmente Pagado"
3. **Verifica**: Debe aparecer un mensaje de éxito
4. **Verifica**: La interfaz debe actualizarse inmediatamente mostrando:
   - Estado cambiado a "Completado"
   - Saldo pendiente = $0.00
   - La orden debe desaparecer del filtro "Pago Pendiente"

### D. Verificar el Recibo Actualizado
1. Haz clic en "Imprimir Recibo" de la orden completada
2. **Verifica**: El recibo debe mostrar:
   - Anticipo pagado = Total de la orden
   - Saldo pendiente = $0.00
   - Sin mensaje de "RECUERDE COMPLETAR EL PAGO"

## Cambios Técnicos Realizados

### En `actions.ts`:
- `completeLayawayPayment()` ahora actualiza `down_payment` al total de la orden
- Mejor manejo de errores y mensajes de confirmación

### En `page.tsx`:
- Agregado `onRefresh` callback para forzar actualización
- Mejorado sistema de tiempo real para escuchar cambios en `orders` y `order_items`
- Mensajes de confirmación visibles con `alert()`

### En la base de datos:
- La vista `full_order_details_view` incluye todos los campos de separado
- Función RPC `process_sale` maneja correctamente los separados

## Posibles Problemas y Soluciones

### Si la interfaz no se actualiza:
1. Verifica que Supabase Real-time esté habilitado
2. Checa la consola del navegador para logs de "change detected"
3. Refresca manualmente la página como último recurso

### Si el estado no cambia en la base de datos:
1. Verifica que el SQL del setup se ejecutó correctamente
2. Checa que las columnas `is_layaway`, `down_payment`, `remaining_balance` existen
3. Verifica permisos de la función `completeLayawayPayment`

## Estados del Separado

| Estado | Descripción | down_payment | remaining_balance |
|--------|-------------|--------------|-------------------|
| `PENDING_PAYMENT` | Separado con saldo pendiente | < total | > 0 |
| `COMPLETED` | Separado totalmente pagado | = total | = 0 |

## Logging para Debug

He agregado console.logs que puedes ver en las herramientas de desarrollador:
- "Order change detected" - cuando hay cambios en la tabla orders
- "Order items change detected" - cuando hay cambios en order_items

Esto te ayudará a confirmar que el sistema de tiempo real está funcionando.
