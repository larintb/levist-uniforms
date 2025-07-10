# Sistema de Separado (Layaway) - Levist Uniforms

## Descripción
Se implementó un sistema completo de separado que permite a los clientes hacer un pago parcial inicial y completar el pago más tarde.

## Funcionalidades Implementadas

### 1. En el POS (Punto de Venta)
- **Nueva opción "¿Es Separado?"**: Checkbox para activar el modo separado
- **Campo de Anticipo**: Permite ingresar el monto del pago inicial
- **Cálculo automático**: Muestra el saldo pendiente en tiempo real
- **Validaciones**: 
  - El anticipo debe ser mayor a $0
  - El anticipo no puede ser mayor al total
  - Automáticamente requiere datos del cliente (activando "Pedido Especial")

### 2. En la Gestión de Órdenes
- **Nuevo estado**: `PENDING_PAYMENT` para órdenes con saldo pendiente
- **Información visual**: 
  - Indica claramente que es un separado
  - Muestra anticipo pagado y saldo pendiente
  - Colores distintivos (verde para pagado, rojo para pendiente)
- **Acción especial**: Botón "Marcar como Totalmente Pagado" para completar el pago

### 3. En los Recibos
- **Sección de Separado**: 
  - Indica claramente que es un separado
  - Muestra anticipo pagado
  - Muestra saldo pendiente
  - Recordatorio para completar el pago (si aplica)

## Flujo de Trabajo

### Para Crear un Separado:
1. Agregar productos al carrito en el POS
2. Activar "¿Es Separado?"
3. Ingresar el monto del anticipo
4. Completar datos del cliente (se activa automáticamente)
5. Procesar la venta con el método de pago preferido

### Estados de la Orden:
- **PENDING_PAYMENT**: Separado con saldo pendiente
- **COMPLETED**: Separado totalmente pagado

### Para Completar un Separado:
1. Ir a la sección de Órdenes
2. Filtrar por "Pago Pendiente" 
3. Seleccionar la orden del separado
4. Hacer clic en "Actualizar Estado"
5. Usar "Marcar como Totalmente Pagado"

## Campos de Base de Datos Añadidos
- `is_layaway`: Boolean que indica si es un separado
- `down_payment`: Monto del anticipo pagado
- `remaining_balance`: Saldo pendiente por pagar

## Instalación
1. Ejecutar el archivo `database/setup_layaway_system.sql` en Supabase
2. Los cambios en el código ya están implementados

## Validaciones Implementadas
- No se puede crear un separado sin anticipo
- El anticipo no puede exceder el total
- Los separados requieren datos del cliente
- Solo los separados con saldo pendiente pueden marcarse como totalmente pagados

## Beneficios
- **Para el negocio**: Mejor gestión de flujo de caja y ventas garantizadas
- **Para el cliente**: Flexibilidad de pago sin perder la disponibilidad del producto
- **Para el personal**: Proceso claro y fácil de seguir con validaciones automáticas
