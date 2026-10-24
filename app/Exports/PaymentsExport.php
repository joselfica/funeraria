<?php

namespace App\Exports;

use App\Models\Payment;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class PaymentsExport implements FromQuery, WithHeadings, WithMapping
{
    public function __construct(
        public ?string $from = null,
        public ?string $to = null
    ) {}

    public function query(): \Illuminate\Database\Eloquent\Builder
    {
        return Payment::with(['service.client'])
            ->when($this->from, fn ($q) => $q->where('payment_date', '>=', $this->from))
            ->when($this->to, fn ($q) => $q->where('payment_date', '<=', $this->to))
            ->orderByDesc('payment_date');
    }

    public function headings(): array
    {
        return ['Comprobante', 'Fecha', 'Servicio', 'Cliente', 'Método', 'Referencia', 'Monto'];
    }

    public function map($payment): array
    {
        return [
            $payment->receipt_number,
            $payment->payment_date->format('d/m/Y'),
            $payment->service->code,
            $payment->service->client->name,
            $payment->payment_method_label,
            $payment->reference ?? '—',
            $payment->amount,
        ];
    }
}<?php

namespace App\Exports;

use App\Models\Payment;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class PaymentsExport implements FromQuery, WithHeadings, WithMapping
{
    public function __construct(
        public ?string $from = null,
        public ?string $to = null
    ) {}

    public function query(): \Illuminate\Database\Eloquent\Builder
    {
        return Payment::with(['service.client'])
            ->when($this->from, fn ($q) => $q->where('payment_date', '>=', $this->from))
            ->when($this->to, fn ($q) => $q->where('payment_date', '<=', $this->to))
            ->orderByDesc('payment_date');
    }

    public function headings(): array
    {
        return ['Comprobante', 'Fecha', 'Servicio', 'Cliente', 'Método', 'Referencia', 'Monto'];
    }

    public function map($payment): array
    {
        return [
            $payment->receipt_number,
            $payment->payment_date->format('d/m/Y'),
            $payment->service->code,
            $payment->service->client->name,
            $payment->payment_method_label,
            $payment->reference ?? '—',
            $payment->amount,
        ];
    }
}