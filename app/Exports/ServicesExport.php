<?php

namespace App\Exports;

use App\Models\Service;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

/**
 * Exportación de servicios a Excel.
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
        return Service::with(['client', 'deceased', 'serviceType', 'branch'])
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
            $service->serviceType->name,
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