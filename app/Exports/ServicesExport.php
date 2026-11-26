<?php

namespace App\Exports;

use App\Models\Service;
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
 * Exportación ejecutiva de servicios a Excel.
 */
class ServicesExport implements
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
        public ?string $to = null,
        public ?string $status = null
    ) {}

    public function title(): string
    {
        return 'Reporte de Servicios';
    }

    public function startCell(): string
    {
        return 'A5';
    }

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
        return [
            'Código',
            'Tipo',
            'Sucursal',
            'Cliente',
            'Fallecido',
            'Fecha',
            'Estado',
            'Total',
            'Pagado',
            'Saldo',
        ];
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
            (float) $service->total_price,
            (float) $service->total_paid,
            (float) $service->balance,
        ];
    }

    public function columnFormats(): array
    {
        return [
            'H' => '$ #,##0',
            'I' => '$ #,##0',
            'J' => '$ #,##0',
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
                $sheet->mergeCells('A1:J1');
                $sheet->setCellValue('A1', 'FUNERARIA CRISTO REY');
                $sheet->getStyle('A1')->applyFromArray([
                    'font' => ['bold' => true, 'size' => 15, 'color' => ['rgb' => '901C1F']],
                ]);

                $filtros = [];
                if ($this->from) {
                    $filtros[] = "Desde: {$this->from}";
                }
                if ($this->to) {
                    $filtros[] = "Hasta: {$this->to}";
                }
                if ($this->status) {
                    $filtros[] = "Estado: {$this->status}";
                }
                $detalleFiltros = count($filtros) ? implode(' · ', $filtros) : 'Todos los registros';

                $sheet->mergeCells('A2:J2');
                $sheet->setCellValue('A2', "REPORTE DE SERVICIOS FUNERARIOS  |  {$detalleFiltros}");
                $sheet->getStyle('A2')->applyFromArray([
                    'font' => ['bold' => true, 'size' => 10, 'color' => ['rgb' => '374151']],
                ]);

                $sheet->mergeCells('A3:J3');
                $sheet->setCellValue('A3', 'Generado el ' . now()->format('d/m/Y \a \l\a\s H:i'));
                $sheet->getStyle('A3')->applyFromArray([
                    'font' => ['italic' => true, 'size' => 9, 'color' => ['rgb' => '6B7280']],
                ]);

                // Altura y alineaciones de cabecera
                $sheet->getRowDimension(1)->setRowHeight(22);
                $sheet->getRowDimension(5)->setRowHeight(24);
                $sheet->getStyle('F5:G5')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle('H5:J5')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

                // AutoFilter y congelar paneles
                $sheet->setAutoFilter("A5:J{$lastRow}");
                $sheet->freezePane('A6');

                if ($lastRow >= 6) {
                    for ($row = 6; $row <= $lastRow; $row++) {
                        $sheet->getRowDimension($row)->setRowHeight(19);
                        if ($row % 2 === 0) {
                            $sheet->getStyle("A{$row}:J{$row}")->getFill()
                                ->setFillType(Fill::FILL_SOLID)
                                ->getStartColor()->setRGB('FAFAFA');
                        }

                        // Resaltar saldo pendiente en rojo o saldado en verde
                        $saldo = (float) $sheet->getCell("J{$row}")->getValue();
                        $colorSaldo = $saldo > 0 ? '901C1F' : '15803D';
                        $sheet->getStyle("J{$row}")->getFont()->setBold(true)->getColor()->setRGB($colorSaldo);
                    }

                    $sheet->getStyle("A6:J{$lastRow}")->applyFromArray([
                        'borders' => [
                            'allBorders' => [
                                'borderStyle' => Border::BORDER_THIN,
                                'color' => ['rgb' => 'E5E7EB'],
                            ],
                        ],
                        'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
                    ]);

                    $sheet->getStyle("A6:A{$lastRow}")->getFont()->setBold(true)->getColor()->setRGB('901C1F');
                    $sheet->getStyle("F6:G{$lastRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                    $sheet->getStyle("H6:H{$lastRow}")->getFont()->setBold(true);
                    $sheet->getStyle("I6:I{$lastRow}")->getFont()->getColor()->setRGB('15803D');

                    // Fila de Totales con fórmulas dinámicas
                    $totalRow = $lastRow + 1;
                    $sheet->getRowDimension($totalRow)->setRowHeight(22);
                    $sheet->setCellValue("G{$totalRow}", 'TOTALES:');
                    $sheet->setCellValue("H{$totalRow}", "=SUM(H6:H{$lastRow})");
                    $sheet->setCellValue("I{$totalRow}", "=SUM(I6:I{$lastRow})");
                    $sheet->setCellValue("J{$totalRow}", "=SUM(J6:J{$lastRow})");

                    $sheet->getStyle("A{$totalRow}:J{$totalRow}")->applyFromArray([
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

                    $sheet->getStyle("G{$totalRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                    $sheet->getStyle("I{$totalRow}")->getFont()->getColor()->setRGB('15803D');
                    $sheet->getStyle("H{$totalRow}:J{$totalRow}")->getNumberFormat()->setFormatCode('$ #,##0');
                }
            },
        ];
    }
}