<?php

namespace App\Exports;

use App\Models\Donation;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithCustomStartCell;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class DonationsExport implements
    FromCollection,
    WithHeadings,
    WithMapping,
    WithStyles,
    ShouldAutoSize,
    WithCustomStartCell,
    WithEvents,
    WithTitle
{
    protected ?string $startDate;
    protected ?string $endDate;
    protected float $totalDinero = 0;

    public function __construct(?string $startDate = null, ?string $endDate = null)
    {
        $this->startDate = $startDate;
        $this->endDate = $endDate;
    }

    public function title(): string
    {
        return 'Reporte de Donaciones';
    }

    public function startCell(): string
    {
        return 'A5';
    }

    public function collection(): Collection
    {
        $query = Donation::with('creator:id,name');

        if ($this->startDate && $this->endDate) {
            $query->whereBetween('donation_date', [$this->startDate, $this->endDate]);
        }

        $donations = $query->orderBy('donation_date', 'desc')->get();

        // Calculamos el total exacto de dinero desde PHP
        $this->totalDinero = (float) $donations
            ->filter(fn ($d) => strtolower(trim((string) $d->type)) === 'dinero')
            ->sum(fn ($d) => (float) $d->amount);

        return $donations;
    }

    public function headings(): array
    {
        return [
            'Fecha',
            'Beneficiario',
            'RUT Beneficiario',
            'Contacto',
            'Tipo',
            'Detalle / Monto ($)',
            'Registrado por',
        ];
    }

    public function map($donation): array
    {
        $isDinero = strtolower(trim((string) $donation->type)) === 'dinero';

        $detalle = $isDinero
            ? (float) $donation->amount
            : ($donation->description ?? '—');

        return [
            $donation->donation_date->format('d/m/Y'),
            $donation->beneficiary_name,
            $donation->beneficiary_rut ?? '—',
            $donation->contact_person ?? '—',
            strtoupper(trim((string) $donation->type)),
            $detalle,
            $donation->creator?->name ?? 'Sistema',
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
            AfterSheet::class => function (AfterSheet $event): void {
                $sheet = $event->sheet->getDelegate();
                $lastRow = $sheet->getHighestRow();

                // Membrete corporativo (Filas 1 a 3)
                $sheet->mergeCells('A1:G1');
                $sheet->setCellValue('A1', 'FUNERARIA CRISTO REY');
                $sheet->getStyle('A1')->applyFromArray([
                    'font' => ['bold' => true, 'size' => 15, 'color' => ['rgb' => '901C1F']],
                ]);

                $periodo = ($this->startDate && $this->endDate)
                    ? "Período: {$this->startDate} al {$this->endDate}"
                    : 'Histórico completo';

                $sheet->mergeCells('A2:G2');
                $sheet->setCellValue('A2', "REPORTE DE DONACIONES Y APORTES SOCIALES  |  {$periodo}");
                $sheet->getStyle('A2')->applyFromArray([
                    'font' => ['bold' => true, 'size' => 10, 'color' => ['rgb' => '374151']],
                ]);

                $sheet->mergeCells('A3:G3');
                $sheet->setCellValue('A3', 'Generado el ' . now()->format('d/m/Y \a \l\a\s H:i'));
                $sheet->getStyle('A3')->applyFromArray([
                    'font' => ['italic' => true, 'size' => 9, 'color' => ['rgb' => '6B7280']],
                ]);

                // Altura y alineación de cabecera
                $sheet->getRowDimension(1)->setRowHeight(22);
                $sheet->getRowDimension(5)->setRowHeight(24);
                $sheet->getStyle('A5')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle('E5')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle('F5')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

                // AutoFilter y congelar paneles
                $sheet->setAutoFilter("A5:G{$lastRow}");
                $sheet->freezePane('A6');

                if ($lastRow >= 6) {
                    for ($row = 6; $row <= $lastRow; $row++) {
                        $sheet->getRowDimension($row)->setRowHeight(19);
                        if ($row % 2 === 0) {
                            $sheet->getStyle("A{$row}:G{$row}")->getFill()
                                ->setFillType(Fill::FILL_SOLID)
                                ->getStartColor()->setRGB('FAFAFA');
                        }

                        $tipo = strtoupper(trim((string) $sheet->getCell("E{$row}")->getValue()));
                        $rawVal = $sheet->getCell("F{$row}")->getValue();

                        if ($tipo === 'DINERO') {
                            $monto = (float) $rawVal;
                            // Forzar celda numérica pura + formato moneda individual
                            $sheet->setCellValueExplicit("F{$row}", $monto, DataType::TYPE_NUMERIC);
                            $sheet->getStyle("F{$row}")->getNumberFormat()->setFormatCode('$ #,##0');
                            $sheet->getStyle("E{$row}")->getFont()->setBold(true)->getColor()->setRGB('15803D');
                            $sheet->getStyle("F{$row}")->getFont()->setBold(true)->getColor()->setRGB('15803D');
                            $sheet->getStyle("F{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                        } else {
                            $sheet->getStyle("E{$row}")->getFont()->setBold(true)->getColor()->setRGB('901C1F');
                            $sheet->getStyle("F{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
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

                    $sheet->getStyle("A6:A{$lastRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                    $sheet->getStyle("B6:B{$lastRow}")->getFont()->setBold(true);
                    $sheet->getStyle("E6:E{$lastRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

                    // ─────────────────────────────────────────────────────────────
                    // FILA DE TOTALES (valor numérico directo, sin fórmula)
                    // ─────────────────────────────────────────────────────────────
                    //
                    // Se escribe el total calculado desde PHP directamente como
                    // valor numérico, usando setCellValueExplicit con
                    // DataType::TYPE_NUMERIC. Esto evita dos problemas típicos:
                    //
                    //   1. Fórmulas "=SUM(...)" que quedan sin calcular cuando
                    //      el archivo se abre en visores que no recalculan
                    //      (p. ej. Google Sheets al importar, o Excel con el
                    //      cálculo automático desactivado). El usuario vería
                    //      "0" o una fórmula visible hasta forzar el recálculo.
                    //
                    //   2. Desfases entre el valor mostrado por la fórmula y el
                    //      total real calculado en PHP (por redondeos o por
                    //      celdas que no son estrictamente numéricas).
                    //
                    // Con el valor escrito directamente, el total es siempre
                    // el correcto, sin depender del motor de cálculo del visor.
                    // ─────────────────────────────────────────────────────────────
                    $totalRow = $lastRow + 1;
                    $sheet->getRowDimension($totalRow)->setRowHeight(22);
                    $sheet->setCellValue("E{$totalRow}", 'TOTAL DINERO:');

                    // 👇 Escribimos el valor calculado directamente
                    $sheet->setCellValueExplicit("F{$totalRow}", $this->totalDinero, DataType::TYPE_NUMERIC);

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

                    $sheet->getStyle("E{$totalRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                    $sheet->getStyle("F{$totalRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                    $sheet->getStyle("F{$totalRow}")->getNumberFormat()->setFormatCode('$ #,##0');
                }
            },
        ];
    }
}