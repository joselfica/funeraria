<?php

namespace App\Exports;

use App\Models\Payment;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Concerns\WithCustomStartCell;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Exportación ejecutiva de pagos a Excel.
 */
class PaymentsExport implements
    FromQuery,
    WithHeadings,
    WithMapping,
    ShouldAutoSize,
    WithStyles,
    WithColumnFormatting,
    WithCustomStartCell,
    WithEvents,
    WithTitle
{
    public function __construct(
        public ?string $from = null,
        public ?string $to = null
    ) {}

    public function title(): string
    {
        return 'Reporte de Ingresos';
    }

    public function startCell(): string
    {
        return 'A5';
    }

    public function query(): \Illuminate\Database\Eloquent\Builder
    {
        return Payment::with(['service.client'])
            ->when($this->from, fn ($q) => $q->where('payment_date', '>=', $this->from))
            ->when($this->to, fn ($q) => $q->where('payment_date', '<=', $this->to))
            ->orderByDesc('payment_date');
    }

    public function headings(): array
    {
        return [
            'Comprobante',
            'Fecha',
            'Servicio',
            'Cliente',
            'Método de Pago',
            'Referencia',
            'Monto',
        ];
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
            (float) $payment->amount,
        ];
    }

    public function columnFormats(): array
    {
        return [
            'G' => '$ #,##0',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            5 => [
                'font' => [
                    'bold' => true,
                    'color' => ['rgb' => 'FFFFFF'],
                    'size' => 10,
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '901C1F'],
                ],
                'alignment' => [
                    'vertical' => Alignment::VERTICAL_CENTER,
                ],
            ],
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $lastRow = $sheet->getHighestRow();

                // 1. Membrete corporativo (Filas 1 a 3)
                $sheet->mergeCells('A1:G1');
                $sheet->setCellValue('A1', 'FUNERARIA CRISTO REY');
                $sheet->getStyle('A1')->applyFromArray([
                    'font' => ['bold' => true, 'size' => 15, 'color' => ['rgb' => '901C1F']],
                ]);

                $periodo = ($this->from || $this->to)
                    ? 'Período: ' . ($this->from ?? 'Inicio') . ' al ' . ($this->to ?? 'Hoy')
                    : 'Histórico completo';

                $sheet->mergeCells('A2:G2');
                $sheet->setCellValue('A2', "REPORTE DE INGRESOS Y RECAUDACIÓN  |  {$periodo}");
                $sheet->getStyle('A2')->applyFromArray([
                    'font' => ['bold' => true, 'size' => 10, 'color' => ['rgb' => '374151']],
                ]);

                $sheet->mergeCells('A3:G3');
                $sheet->setCellValue('A3', 'Generado el ' . now()->format('d/m/Y \a \l\a\s H:i'));
                $sheet->getStyle('A3')->applyFromArray([
                    'font' => ['italic' => true, 'size' => 9, 'color' => ['rgb' => '6B7280']],
                ]);

                // Altura de filas y alineación cabecera
                $sheet->getRowDimension(1)->setRowHeight(22);
                $sheet->getRowDimension(5)->setRowHeight(24);
                $sheet->getStyle('B5')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle('G5')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

                // AutoFilter y congelar paneles bajo la cabecera
                $sheet->setAutoFilter("A5:G{$lastRow}");
                $sheet->freezePane('A6');

                if ($lastRow >= 6) {
                    // Estilizado de filas de datos (cebra + bordes suaves)
                    for ($row = 6; $row <= $lastRow; $row++) {
                        $sheet->getRowDimension($row)->setRowHeight(19);
                        if ($row % 2 === 0) {
                            $sheet->getStyle("A{$row}:G{$row}")->getFill()
                                ->setFillType(Fill::FILL_SOLID)
                                ->getStartColor()->setRGB('FAFAFA');
                        }
                    }

                    $sheet->getStyle("A6:G{$lastRow}")->applyFromArray([
                        'borders' => [
                            'allBorders' => [
                                'borderStyle' => Border::BORDER_THIN,
                                'color' => ['rgb' => 'E5E7EB'],
                            ],
                        ],
                        'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
                    ]);

                    $sheet->getStyle("A6:A{$lastRow}")->getFont()->setBold(true)->getColor()->setRGB('901C1F');
                    $sheet->getStyle("B6:B{$lastRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                    $sheet->getStyle("G6:G{$lastRow}")->getFont()->setBold(true);

                    // Fila de Totales al final
                    $totalRow = $lastRow + 1;
                    $sheet->getRowDimension($totalRow)->setRowHeight(22);
                    $sheet->setCellValue("F{$totalRow}", 'TOTAL RECAUDADO:');
                    $sheet->setCellValue("G{$totalRow}", "=SUM(G6:G{$lastRow})");

                    $sheet->getStyle("A{$totalRow}:G{$totalRow}")->applyFromArray([
                        'font' => ['bold' => true, 'size' => 10, 'color' => ['rgb' => '901C1F']],
                        'fill' => [
                            'fillType' => Fill::FILL_SOLID,
                            'startColor' => ['rgb' => 'FDF2F2'],
                        ],
                        'borders' => [
                            'top' => ['borderStyle' => Border::BORDER_MEDIUM, 'color' => ['rgb' => '901C1F']],
                            'bottom' => ['borderStyle' => Border::BORDER_MEDIUM, 'color' => ['rgb' => '901C1F']],
                        ],
                        'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
                    ]);
                    $sheet->getStyle("F{$totalRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                    $sheet->getStyle("G{$totalRow}")->getNumberFormat()->setFormatCode('$ #,##0');
                }
            },
        ];
    }
}