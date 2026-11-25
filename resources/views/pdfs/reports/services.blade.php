<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte de Servicios</title>
    <style>
        @page { margin: 20px; }
        body { font-family: Helvetica, Arial, sans-serif; font-size: 9px; color: #333; }
        .header { text-align: center; border-bottom: 3px solid #1e293b; padding-bottom: 10px; margin-bottom: 15px; }
        .header .logo { width: 180px; margin-bottom: 4px; }
        .header h1 { font-size: 18px; margin: 0; color: #1e293b; }
        .header p { font-size: 10px; margin: 2px 0; color: #64748b; }
        .filters { background: #f1f5f9; padding: 8px; margin-bottom: 15px; font-size: 9px; border-radius: 4px; }
        table { width: 100%; border-collapse: collapse; font-size: 8px; }
        th { background: #1e293b; color: white; padding: 6px 4px; text-align: left; }
        td { padding: 5px 4px; border-bottom: 1px solid #e2e8f0; }
        tr:nth-child(even) { background: #f8fafc; }
        .total-row { background: #ecfdf5 !important; font-weight: bold; }
        .footer { position: fixed; bottom: 10px; left: 0; right: 0; text-align: center; font-size: 8px; color: #94a3b8; }
    </style>
</head>
<body>
    @php
        $logoPath = public_path('images/logo-pdf.png');
        $logo = file_exists($logoPath)
            ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath))
            : null;
    @endphp

    <div class="header">
        @if ($logo)
            <img src="{{ $logo }}" class="logo" alt="Funeraria Cristo Rey">
        @else
            <h1>Funeraria Cristo Rey</h1>
        @endif
        <p>Reporte de Servicios Funerarios</p>
    </div>

    <div class="filters">
        <strong>Filtros aplicados:</strong>
        @if ($from) Desde: {{ \Carbon\Carbon::parse($from)->format('d/m/Y') }} | @endif
        @if ($to) Hasta: {{ \Carbon\Carbon::parse($to)->format('d/m/Y') }} | @endif
        @if ($status) Estado: {{ $status }} | @endif
        Total: {{ $services->count() }} registros
    </div>

    <table>
        <thead>
            <tr>
                <th>Código</th>
                <th>Tipo</th>
                <th>Cliente</th>
                <th>Fallecido</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Total</th>
                <th>Pagado</th>
                <th>Saldo</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($services as $service)
                <tr>
                    <td>{{ $service->code }}</td>
                    <td>{{ $service->service_type_label }}</td>
                    <td>{{ $service->client->name }}</td>
                    <td>{{ $service->deceased->full_name }}</td>
                    <td>{{ $service->scheduled_at->format('d/m/Y') }}</td>
                    <td>{{ $service->status_label }}</td>
                    <td>${{ number_format($service->total_price, 0, ',', '.') }}</td>
                    <td>${{ number_format($service->total_paid, 0, ',', '.') }}</td>
                    <td>${{ number_format($service->balance, 0, ',', '.') }}</td>
                </tr>
            @endforeach
            <tr class="total-row">
                <td colspan="6">TOTALES</td>
                <td>${{ number_format($services->sum('total_price'), 0, ',', '.') }}</td>
                <td>${{ number_format($services->sum(fn ($s) => $s->total_paid), 0, ',', '.') }}</td>
                <td>${{ number_format($services->sum(fn ($s) => $s->balance), 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>

    <div class="footer">
        Generado el {{ $generatedAt->format('d/m/Y \a \l\a\s H:i') }} — Funeraria Cristo Rey
    </div>
</body>
</html>