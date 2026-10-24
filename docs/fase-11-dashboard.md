# Fase 11 — Dashboard con KPIs

## Objetivo
Mostrar en una vista única los indicadores clave del negocio en tiempo real.

## Componentes implementados

### 1. KPIs (Key Performance Indicators)
- Total clientes activos
- Servicios activos (status accepted o in_progress)
- Ingresos del mes (SUM payments del mes actual)
- Total registros de fallecidos

### 2. Gráfico de Ingresos
- Línea con ingresos de los últimos 6 meses
- Librería: Recharts
- Muestra la evolución mensual

### 3. Estado de la Flota
- Total vehículos
- Desglose por estado (disponibles, en servicio, mantenimiento)
- Colores semafóricos

### 4. Alertas de Stock
- Items con stock <= stock_minimum
- Top 5 más críticos
- Link al inventario

### 5. Próximos Servicios
- Servicios programados para los próximos 7 días
- Link directo al detalle
- Muestra código, fallecido, cliente, fecha

## Consultas SQL destacadas
- Suma de ingresos por mes: `SUM(amount)` agrupado por año/mes
- Total pagado: `SUM(payments.amount)` desde Service
- Stock crítico: `WHERE stock <= stock_minimum`

## Cumplimiento
- Requerimiento M11 — Dashboard con KPIs
- Requerimiento M12 — Notificaciones y alertas
- Indicador 2.1.3.5 — Prototipos funcionales
- Indicador 2.1.3.6 — Consistencia visual (shadcn/ui + Tailwind)

## Capturas
- Dashboard completo
- KPIs en tiempo real
- Gráfico de ingresos
- Estado de flota
- Alertas de stock