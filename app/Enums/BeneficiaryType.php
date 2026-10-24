<?php

namespace App\Enums;

/**
 * Tipos de beneficiario para el pago de servicios funerarios.
 * 
 * Según el negocio real:
 * - AFP: $600K AFP + $600K familia
 * - AdultoMayor: $1.070.000 asignación (sin AFP)
 * - MenorSinBeneficio: paga total, posible municipal
 * - Municipal: cobro diferido (~3 meses)
 * - Particular: paga 100% al contado
 */
enum BeneficiaryType: string
{
    case AFP = 'afp';
    case AdultoMayor = 'adulto_mayor';
    case MenorSinBeneficio = 'menor_sin_beneficio';
    case Municipal = 'municipal';
    case Particular = 'particular';

    public function label(): string
    {
        return match ($this) {
            self::AFP => 'AFP',
            self::AdultoMayor => 'Adulto Mayor (asignación)',
            self::MenorSinBeneficio => 'Menor (sin beneficio)',
            self::Municipal => 'Municipalidad',
            self::Particular => 'Particular',
        };
    }

    /**
     * Monto esperado de la AFP (solo aplica a BeneficiaryType::AFP).
     */
    public function afpAmount(): float
    {
        return match ($this) {
            self::AFP => 600000,
            self::AdultoMayor => 0,
            self::MenorSinBeneficio => 0,
            self::Municipal => 0,
            self::Particular => 0,
        };
    }
}