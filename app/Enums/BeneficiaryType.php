<?php

namespace App\Enums;

/**
 * Tipos de beneficiario para el pago de servicios funerarios.
 * 
 * Instituciones previsionales chilenas que pagan cuota mortuoria:
 * - AFP (Administradoras de Fondos de Pensiones)
 * - IPS (Instituto de Previsión Social)
 * - Dipreca (Dirección de Previsión de Carabineros)
 * - Capredena (Caja de Previsión de la Defensa Nacional)
 * 
 * Otras opciones:
 * - Municipal: ayuda municipal (~3 meses de demora)
 * - Particular: paga 100% de su bolsillo
 */
enum BeneficiaryType: string
{
    case AFP = 'afp';
    case IPS = 'ips';
    case Dipreca = 'dipreca';
    case Capredena = 'capredena';
    case Municipal = 'municipal';
    case Particular = 'particular';

    public function label(): string
    {
        return match ($this) {
            self::AFP => 'AFP (cuota mortuoria)',
            self::IPS => 'IPS (cuota mortuoria)',
            self::Dipreca => 'Dipreca (cuota mortuoria)',
            self::Capredena => 'Capredena (cuota mortuoria)',
            self::Municipal => 'Municipalidad (ayuda)',
            self::Particular => 'Particular (pago directo)',
        };
    }

    /**
     * Indica si este tipo requiere factura a la institución.
     */
    public function requiresInvoice(): bool
    {
        return in_array($this, [
            self::AFP, self::IPS, self::Dipreca, self::Capredena,
        ]);
    }

    /**
     * Monto esperado de la institución (cuota mortuoria).
     * El valor real varía según la institución y el año.
     */
    public function defaultAmount(): float
    {
        return match ($this) {
            self::AFP => 600000,
            self::IPS => 600000,
            self::Dipreca => 600000,
            self::Capredena => 600000,
            self::Municipal => 0,
            self::Particular => 0,
        };
    }

    /**
     * Etiqueta corta para tablas y badges.
     */
    public function shortLabel(): string
    {
        return match ($this) {
            self::AFP => 'AFP',
            self::IPS => 'IPS',
            self::Dipreca => 'Dipreca',
            self::Capredena => 'Capredena',
            self::Municipal => 'Municipal',
            self::Particular => 'Particular',
        };
    }
}