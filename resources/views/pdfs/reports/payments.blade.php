<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte de Ingresos</title>
    <style>
        @page { margin: 25px 25px 40px 25px; }
        body { font-family: Helvetica, Arial, sans-serif; font-size: 9px; color: #1f2937; margin: 0; }
        
        /* Encabezado */
        .header-table { width: 100%; border-bottom: 2px solid #7f1d1d; padding-bottom: 12px; margin-bottom: 14px; }
        .header-logo { width: 150px; }
        .header-title { text-align: right; vertical-align: middle; }
        .header-title h1 { font-size: 16px; color: #7f1d1d; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
        .header-title p { font-size: 9px; color: #6b7280; margin: 3px 0 0 0; }

        /* Barra de filtros */
        .filters-bar { background: #f3f4f6; border: 1px solid #e5e7eb; padding: 7px 12px; margin-bottom: 14px; font-size: 8.5px; border-radius: 4px; color: #4b5563; }
        .filters-bar strong { color: #111827; }

        /* Tarjeta KPI */
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
        table.data-table tr.summary-row td { background: #f3f4f6; border-top: 2px solid #7f1d1d; font-weight: bold; color: #111827; font-size: 9.5px; }

        .badge { display: inline-block; padding: 2px 6px; background: #fef3c7; border: 1px solid #fde68a; border-radius: 3px; font-size: 7.5px; color: #92400e; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        .code { font-weight: bold; color: #7f1d1d; }

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
                <h1>Reporte de Ingresos</h1>
                <p>Detalle de Pagos y Recaudación</p>
            </td>
        </tr>
    </table>

    <div class="filters-bar">
        <strong>Período y Filtros:</strong>
        @if ($from) Desde el <strong>{{ \Carbon\Carbon::parse($from)->format('d/m/Y') }}</strong> &nbsp;|&nbsp; @endif
        @if ($to) Hasta el <strong>{{ \Carbon\Carbon::parse($to)->format('d/m/Y') }}</strong> &nbsp;|&nbsp; @endif
        @if (!$from && !$to) Histórico completo &nbsp;|&nbsp; @endif
        Transacciones: <strong>{{ $payments->count() }}</strong>
    </div>

    <div class="kpi-card">
        <table class="kpi-table">
            <tr>
                <td>
                    <div class="kpi-label">Total Recaudado</div>
                    <div class="kpi-sub">Suma total de comprobantes emitidos en el período</div>
                </td>
                <td class="kpi-amount">${{ number_format($total, 0, ',', '.') }}</td>
            </tr>
        </table>
    </div>

    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 12%;">Comprobante</th>
                <th style="width: 10%;">Fecha</th>
                <th style="width: 11%;">Servicio</th>
                <th style="width: 25%;">Cliente</th>
                <th style="width: 14%;">Método</th>
                <th style="width: 14%;">Referencia</th>
                <th class="right" style="width: 14%;">Monto</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($payments as $payment)
                <tr>
                    <td class="code">{{ $payment->receipt_number }}</td>
                    <td>{{ $payment->payment_date->format('d/m/Y') }}</td>
                    <td class="bold">{{ $payment->service->code }}</td>
                    <td>{{ $payment->service->client->name }}</td>
                    <td><span class="badge">{{ $payment->payment_method_label }}</span></td>
                    <td style="color: #6b7280;">{{ $payment->reference ?? '—' }}</td>
                    <td class="right bold">${{ number_format($payment->amount, 0, ',', '.') }}</td>
                </tr>
            @endforeach
            <tr class="summary-row">
                <td colspan="6" class="right">TOTAL RECAUDADO:</td>
                <td class="right" style="color: #7f1d1d;">${{ number_format($total, 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>

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