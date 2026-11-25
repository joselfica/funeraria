<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte de Servicios</title>
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

        /* Resumen superior de 3 columnas */
        .summary-grid { width: 100%; border-collapse: separate; border-spacing: 8px 0; margin: 0 -8px 14px -8px; }
        .summary-box { background: #f9fafb; border: 1px solid #e5e7eb; border-top: 3px solid #7f1d1d; padding: 8px 10px; border-radius: 4px; width: 33.33%; }
        .summary-box.paid { border-top-color: #15803d; }
        .summary-box.balance { border-top-color: #b45309; }
        .s-label { font-size: 7.5px; text-transform: uppercase; color: #6b7280; font-weight: bold; }
        .s-val { font-size: 14px; font-weight: bold; color: #111827; margin-top: 3px; }

        /* Tabla principal */
        table.data-table { width: 100%; border-collapse: collapse; font-size: 8px; }
        table.data-table th { background: #7f1d1d; color: #ffffff; padding: 7px 5px; text-align: left; font-size: 7.5px; text-transform: uppercase; letter-spacing: 0.3px; }
        table.data-table td { padding: 6px 5px; border-bottom: 1px solid #e5e7eb; color: #374151; }
        table.data-table tr:nth-child(even) td { background: #f9fafb; }
        table.data-table tr.total-row td { background: #fdf8f8; border-top: 2px solid #7f1d1d; border-bottom: 2px solid #7f1d1d; font-weight: bold; color: #111827; font-size: 8.5px; }

        .badge { display: inline-block; padding: 2px 5px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 3px; font-size: 7px; color: #374151; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        .code { font-weight: bold; color: #7f1d1d; }
        .text-green { color: #15803d; }
        .text-amber { color: #b45309; }

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

        $sumTotal   = $services->sum('total_price');
        $sumPaid    = $services->sum(fn ($s) => $s->total_paid);
        $sumBalance = $services->sum(fn ($s) => $s->balance);
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
                <h1>Reporte de Servicios Funerarios</h1>
                <p>Resumen Operativo y Estado de Cuenta</p>
            </td>
        </tr>
    </table>

    <div class="filters-bar">
        <strong>Filtros aplicados:</strong>
        @if ($from) Desde: <strong>{{ \Carbon\Carbon::parse($from)->format('d/m/Y') }}</strong> &nbsp;|&nbsp; @endif
        @if ($to) Hasta: <strong>{{ \Carbon\Carbon::parse($to)->format('d/m/Y') }}</strong> &nbsp;|&nbsp; @endif
        @if ($status) Estado: <strong>{{ $status }}</strong> &nbsp;|&nbsp; @endif
        Registros encontrados: <strong>{{ $services->count() }}</strong>
    </div>

    <table class="summary-grid">
        <tr>
            <td class="summary-box">
                <div class="s-label">Total Contratado</div>
                <div class="s-val">${{ number_format($sumTotal, 0, ',', '.') }}</div>
            </td>
            <td class="summary-box paid">
                <div class="s-label">Total Abonado / Pagado</div>
                <div class="s-val text-green">${{ number_format($sumPaid, 0, ',', '.') }}</div>
            </td>
            <td class="summary-box balance">
                <div class="s-label">Saldo Pendiente</div>
                <div class="s-val text-amber">${{ number_format($sumBalance, 0, ',', '.') }}</div>
            </td>
        </tr>
    </table>

    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 10%;">Código</th>
                <th style="width: 12%;">Tipo</th>
                <th style="width: 18%;">Cliente</th>
                <th style="width: 18%;">Fallecido</th>
                <th style="width: 9%;">Fecha</th>
                <th style="width: 9%;">Estado</th>
                <th class="right" style="width: 8%;">Total</th>
                <th class="right" style="width: 8%;">Pagado</th>
                <th class="right" style="width: 8%;">Saldo</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($services as $service)
                <tr>
                    <td class="code">{{ $service->code }}</td>
                    <td>{{ $service->service_type_label }}</td>
                    <td class="bold">{{ $service->client->name }}</td>
                    <td>{{ $service->deceased->full_name }}</td>
                    <td>{{ $service->scheduled_at->format('d/m/Y') }}</td>
                    <td><span class="badge">{{ $service->status_label }}</span></td>
                    <td class="right bold">${{ number_format($service->total_price, 0, ',', '.') }}</td>
                    <td class="right text-green">${{ number_format($service->total_paid, 0, ',', '.') }}</td>
                    <td class="right {{ $service->balance > 0 ? 'text-amber bold' : '' }}">
                        ${{ number_format($service->balance, 0, ',', '.') }}
                    </td>
                </tr>
            @endforeach
            <tr class="total-row">
                <td colspan="6" class="right">TOTALES GENERALES:</td>
                <td class="right">${{ number_format($sumTotal, 0, ',', '.') }}</td>
                <td class="right text-green">${{ number_format($sumPaid, 0, ',', '.') }}</td>
                <td class="right text-amber">${{ number_format($sumBalance, 0, ',', '.') }}</td>
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