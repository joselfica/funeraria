<?php

namespace App\Enums;

enum ServiceTypeEnum: string
{
    case ATAUD = 'ataud';
    case URNA = 'urna';

    /**
     * Nombre legible del tipo de servicio.
     */
    public function label(): string
    {
        return match ($this) {
            self::ATAUD => 'Servicio con Ataúd',
            self::URNA => 'Servicio con Urna',
        };
    }

    /**
     * Precio base del servicio.
     */
    public function basePrice(): float
    {
        return match ($this) {
            self::ATAUD => 850000.00,
            self::URNA => 650000.00,
        };
    }

    /**
     * Duración en horas del servicio.
     */
    public function durationHours(): int
    {
        return match ($this) {
            self::ATAUD => 48,
            self::URNA => 48,
        };
    }
}