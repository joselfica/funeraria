<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte de Ingresos</title>
    <style>
        @page { margin: 20px; }
        body { font-family: Helvetica, Arial, sans-serif; font-size: 9px; color: #333; }
        .header { text-align: center; border-bottom: 3px solid #1e293b; padding-bottom: 10px; margin-bottom: 15px; }
        .header .logo { width: 180px; margin-bottom: 4px; }
        .header h1 { font-size: 18px; margin: 0; }
        .header p { font-size: 10px; margin: 2px 0; color: #64748b; }
        .filters { background: #f1f5f9; padding: 8px; margin-bottom: 15px; font-size: 9px; border-radius: 4px; }
        .summary { background: #ecfdf5; border: 2px solid #10b981; padding: 12px; margin-bottom: 15px; text-align: center; border-radius: 6px; }
        .summary .label { font-size: 11px; color: #065f46; }
        .summary .amount { font-size: 22px; font-weight: bold; color: #10b981; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; font-size: 8px; }
        th { background: #1e293b; color: white; padding: 6px 4px; text-align: left; }
        td { padding: 5px 4px; border-bottom: 1px solid #e2e8f0; }
        tr:nth-child(even) { background: #f8fafc; }
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
        <p>Reporte de Ingresos</p>
    </div>

    <div class="filters">
        <strong>Filtros:</strong>
        @if ($from) Desde: {{ \Carbon\Carbon::parse($from)->format('d/m/Y') }} | @endif
        @if ($to) Hasta: {{ \Carbon\Carbon::parse($to)->format('d/m/Y') }} | @endif
        Total de pagos: {{ $payments->count() }}
    </div>

    <div class="summary">
        <div class="label">TOTAL RECAUDADO</div>
        <div class="amount">${{ number_format($total, 0, ',', '.') }}</div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Comprobante</th>
                <th>Fecha</th>
                <th>Servicio</th>
                <th>Cliente</th>
                <th>Método</th>
                <th>Referencia</th>
                <th>Monto</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($payments as $payment)
                <tr>
                    <td>{{ $payment->receipt_number }}</td>
                    <td>{{ $payment->payment_date->format('d/m/Y') }}</td>
                    <td>{{ $payment->service->code }}</td>
                    <td>{{ $payment->service->client->name }}</td>
                    <td>{{ $payment->payment_method_label }}</td>
                    <td>{{ $payment->reference ?? '—' }}</td>
                    <td>${{ number_format($payment->amount, 0, ',', '.') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        Generado el {{ $generatedAt->format('d/m/Y \a \l\a\s H:i') }} — Funeraria Cristo Rey
    </div>
</body>
</html>