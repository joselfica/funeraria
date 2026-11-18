<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte de Inventario</title>
    <style>
        @page { margin: 20px; }
        body { font-family: Helvetica, Arial, sans-serif; font-size: 9px; color: #333; }
        .header { text-align: center; border-bottom: 3px solid #1e293b; padding-bottom: 10px; margin-bottom: 15px; }
        .header h1 { font-size: 18px; margin: 0; }
        .header p { font-size: 10px; margin: 2px 0; color: #64748b; }
        .summary { background: #ecfdf5; border: 2px solid #10b981; padding: 12px; margin-bottom: 15px; text-align: center; border-radius: 6px; }
        .summary .label { font-size: 11px; color: #065f46; }
        .summary .amount { font-size: 22px; font-weight: bold; color: #10b981; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; font-size: 8px; }
        th { background: #1e293b; color: white; padding: 6px 4px; text-align: left; }
        td { padding: 5px 4px; border-bottom: 1px solid #e2e8f0; }
        tr:nth-child(even) { background: #f8fafc; }
        .critical { color: #dc2626; font-weight: bold; }
        .footer { position: fixed; bottom: 10px; left: 0; right: 0; text-align: center; font-size: 8px; color: #94a3b8; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Funeraria Cristo Rey</h1>
        <p>Reporte de Inventario</p>
    </div>

    <div class="summary">
        <div class="label">VALOR TOTAL DEL INVENTARIO</div>
        <div class="amount">${{ number_format($totalValue, 0, ',', '.') }}</div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Condición</th>
                <th>Disponibles</th>
                <th>Alerta</th>
                <th>Precio</th>
                <th>Valor Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($items as $item)
                <tr>
                    <td>{{ $item->code }}</td>
                    <td>{{ $item->name }}</td>
                    <td>{{ $item->category_label }}</td>
                    <td>{{ $item->condition_label }}</td>
                    <td class="{{ $item->is_low_stock ? 'critical' : '' }}">{{ $item->available_stock }}</td>
                    <td>{{ $item->alert_threshold }}</td>
                    <td>${{ number_format($item->price, 0, ',', '.') }}</td>
                    <td>${{ number_format($item->available_stock * $item->price, 0, ',', '.') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        Generado el {{ $generatedAt->format('d/m/Y \a \l\a\s H:i') }} — Funeraria Cristo Rey
    </div>
</body>
</html>