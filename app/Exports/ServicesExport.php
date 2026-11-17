<?php

namespace App\Exports;

use App\Models\Service;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

/**
 * Exportación de servicios a Excel.
 *
 * Nota: ya no se hace eager load de `serviceType` porque la relación
 * fue eliminada del modelo Service (migró a `service_type` enum string).
 * El nombre legible se obtiene con `service_type_label` en el mapeo.
 */
class ServicesExport implements FromQuery, WithHeadings, WithMapping
{
    public function __construct(
        public ?string $from = null,
        public ?string $to = null,
        public ?string $status = null
    ) {}

    public function query(): \Illuminate\Database\Eloquent\Builder
    {
        return Service::with(['client', 'deceased', 'branch'])
            ->when($this->from, fn ($q) => $q->where('scheduled_at', '>=', $this->from))
            ->when($this->to, fn ($q) => $q->where('scheduled_at', '<=', $this->to))
            ->when($this->status, fn ($q) => $q->where('status', $this->status))
            ->orderByDesc('scheduled_at');
    }

    public function headings(): array
    {
        return ['Código', 'Tipo', 'Sucursal', 'Cliente', 'Fallecido', 'Fecha', 'Estado', 'Total', 'Pagado', 'Saldo'];
    }

    public function map($service): array
    {
        return [
            $service->code,
            $service->service_type_label,
            $service->branch->name ?? '—',
            $service->client->name,
            $service->deceased->full_name,
            $service->scheduled_at->format('d/m/Y H:i'),
            $service->status_label,
            $service->total_price,
            $service->total_paid,
            $service->balance,
        ];
    }
}