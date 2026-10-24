# Fase 10 — Módulo Financiero

## Objetivo
Registrar abonos, calcular saldos automáticamente y generar comprobantes PDF.

## Estructura
- Tabla `payments` (18 columnas)
- Modelo `Payment` con UUID + número autogenerado (PAG-2026-0001)
- Enums: payment_method (efectivo, transferencia, tarjeta, cheque, convenio)

## Funcionalidades
- ✅ Registro de pagos parciales o totales
- ✅ Cálculo automático de saldo (total_price - SUM(payments))
- ✅ Estados: "Sin pagos", "Parcialmente pagado", "Pagado"
- ✅ Generación de comprobante PDF (dompdf)
- ✅ Almacenamiento en storage local (futuro: S3)
- ✅ Descarga de PDF bajo demanda
- ✅ Auditoría: registered_by + timestamps
- ✅ Soft deletes (recuperable)

## Cálculos
```php
// En el modelo Service
public function getTotalPaidAttribute(): float {
    return (float) $this->payments()->sum('amount');
}

public function getBalanceAttribute(): float {
    return (float) $this->total_price - $this->total_paid;
}

public function getIsFullyPaidAttribute(): bool {
    return $this->balance <= 0.01;
}