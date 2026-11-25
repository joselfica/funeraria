<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte de Inventario</title>
    <style>
        @page { margin: 25px 25px 40px 25px; }
        body { font-family: Helvetica, Arial, sans-serif; font-size: 9px; color: #1f2937; margin: 0; }
        
        /* Encabezado tipo membrete ejecutivo */
        .header-table { width: 100%; border-bottom: 2px solid #7f1d1d; padding-bottom: 12px; margin-bottom: 16px; }
        .header-logo { width: 150px; }
        .header-title { text-align: right; vertical-align: middle; }
        .header-title h1 { font-size: 16px; color: #7f1d1d; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
        .header-title p { font-size: 9px; color: #6b7280; margin: 3px 0 0 0; }

        /* Tarjeta de KPI / Resumen */
        .kpi-card { background: #fdf8f8; border: 1px solid #fecaca; border-left: 4px solid #7f1d1d; padding: 12px 16px; margin-bottom: 16px; border-radius: 4px; }
        .kpi-table { width: 100%; border-collapse: collapse; }
        .kpi-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.8px; color: #7f1d1d; font-weight: bold; }
        .kpi-sub { font-size: 8px; color: #6b7280; margin-top: 2px; }
        .kpi-amount { font-size: 20px; font-weight: bold; color: #111827; text-align: right; }

        /* Tabla principal */
        table.data-table { width: 100%; border-collapse: collapse; font-size: 8.5px; }
        table.data-table th { background: #7f1d1d; color: #ffffff; padding: 7px 6px; text-align: left; font-size: 8px; text-transform: uppercase; letter-spacing: 0.4px; }
        table.data-table td { padding: 6px; border-bottom: 1px solid #e5e7eb; color: #374151; }
        table.data-table tr:nth-child(even) td { background: #f9fafb; }
        
        .badge { display: inline-block; padding: 2px 6px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 3px; font-size: 7.5px; color: #374151; }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        .code { font-weight: bold; color: #7f1d1d; }

        /* Bloque de totales */
        .totals-box { width: 45%; margin-left: auto; margin-top: 14px; page-break-inside: avoid; border: 1px solid #e5e7eb; border-radius: 4px; background: #f9fafb; }
        .totals-table { width: 100%; border-collapse: collapse; }
        .totals-table td { padding: 6px 10px; font-size: 9px; border-bottom: 1px solid #e5e7eb; }
        .totals-table tr.grand td { background: #7f1d1d; color: #ffffff; font-size: 10.5px; border-bottom: none; }

        /* Pie de página */
        .footer { position: fixed; bottom: -25px; left: 0; right: 0; border-top: 1px solid #e5e7eb; padding-top: 6px; font-size: 7.5px; color: #9ca3af; }
        .footer-table { width: 100%; }
    </style>
</head>
<body>
    @php
        $logoPath = public_path('images/logo-pdf.png');
        $logo = file_exists($logoPath)
            ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath))
            : null;
    @endphp

    <table class="header-table">
        <tr>
            <td>
                @if ($logo)
                    <img src="{{ $logo }}" class="header-logo" alt="Funeraria Cristo Rey">
                @else
                    <strong style="font-size: 16px; color: #7f1d1d;">FUNERARIA CRISTO REY</strong>
                @endif
            </td>
            <td class="header-title">
                <h1>Reporte de Inventario</h1>
                <p>Control de Stock y Valorización de Activos</p>
            </td>
        </tr>
    </table>

    <div class="kpi-card">
        <table class="kpi-table">
            <tr>
                <td>
                    <div class="kpi-label">Valor Total del Inventario</div>
                    <div class="kpi-sub">Total de unidades físicas registradas: {{ $items->count() }}</div>
                </td>
                <td class="kpi-amount">${{ number_format($totalValue, 0, ',', '.') }}</td>
            </tr>
        </table>
    </div>

    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 12%;">Código</th>
                <th style="width: 34%;">Nombre / Modelo</th>
                <th style="width: 16%;">Categoría</th>
                <th style="width: 16%;">Condición</th>
                <th class="center" style="width: 8%;">Cant.</th>
                <th class="right" style="width: 14%;">Precio</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($items as $item)
                <tr>
                    <td class="code">{{ $item->code }}</td>
                    <td class="bold">{{ $item->name }}</td>
                    <td>{{ $item->category_label }}</td>
                    <td><span class="badge">{{ $item->condition_label }}</span></td>
                    <td class="center">1</td>
                    <td class="right bold">${{ number_format((float) $item->price, 0, ',', '.') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="totals-box">
        <table class="totals-table">
            <tr>
                <td style="color: #4b5563;">Subtotal Ataúdes:</td>
                <td class="right bold">${{ number_format($totalAtaudes ?? 0, 0, ',', '.') }}</td>
            </tr>
            <tr>
                <td style="color: #4b5563;">Subtotal Urnas:</td>
                <td class="right bold">${{ number_format($totalUrnas ?? 0, 0, ',', '.') }}</td>
            </tr>
            <tr class="grand">
                <td class="bold">TOTAL GENERAL:</td>
                <td class="right bold">${{ number_format($totalValue, 0, ',', '.') }}</td>
            </tr>
        </table>
    </div>

    <div class="footer">
        <table class="footer-table">
            <tr>
                <td>Funeraria Cristo Rey — Blanco Encalada 142, Temuco</td>
                <td class="right">Emitido el {{ $generatedAt->format('d/m/Y \a \l\a\s H:i') }}</td>
            </tr>
        </table>
    </div>
</body>
</html>