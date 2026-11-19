<?php

namespace App\Enums;

/**
 * Tipo de beneficiario que financia un servicio funerario.
 *
 * Indica quién paga (o aporta) el costo del servicio:
 * - Instituciones previsionales chilenas que entregan cuota mortuoria
 *   (AFP, IPS, Dipreca, Capredena).
 * - Municipalidad, mediante ayuda social.
 * - Particular, que paga directamente.
 *
 * Este enum solo identifica y rotula al beneficiario. No contiene precios,
 * montos ni descuentos: esa lógica debe vivir en otra capa del sistema.
 *
 * El valor de cada caso (string) es el que se persiste en la base de datos,
 * por lo que cambiarlo requiere migrar los registros existentes.
 */
enum BeneficiaryType: string
{
    /** Administradoras de Fondos de Pensiones (cuota mortuoria). */
    case AFP = 'afp';

    /** Instituto de Previsión Social (cuota mortuoria). */
    case IPS = 'ips';

    /** Dirección de Previsión de Carabineros de Chile (cuota mortuoria). */
    case DIPRECA = 'dipreca';

    /** Caja de Previsión de la Defensa Nacional (cuota mortuoria). */
    case CAPREDENA = 'capredena';

    /** Ayuda social entregada por la municipalidad. */
    case MUNICIPALIDAD = 'municipalidad';

    /** Pago directo por parte de la familia o el solicitante. */
    case PARTICULAR = 'particular';

    /**
     * Etiqueta legible para mostrar en formularios, tablas y reportes.
     *
     * @return string Texto en español, listo para la interfaz.
     */
    public function label(): string
    {
        return match($this) {
            self::AFP => 'AFP (cuota mortuoria)',
            self::IPS => 'IPS (cuota mortuoria)',
            self::DIPRECA => 'Dipreca (cuota mortuoria)',
            self::CAPREDENA => 'Capredena (cuota mortuoria)',
            self::MUNICIPALIDAD => 'Municipalidad (ayuda)',
            self::PARTICULAR => 'Particular (pago directo)',
        };
    }
}