<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Comprobante {{ $payment->receipt_number }}</title>
    <style>
        @page { margin: 30px; }
        body { font-family: Helvetica, Arial, sans-serif; font-size: 12px; color: #333; }
        .header { text-align: center; border-bottom: 3px solid #1e293b; padding-bottom: 15px; margin-bottom: 20px; }
        .header h1 { color: #1e293b; font-size: 22px; margin: 0; }
        .header p { color: #64748b; font-size: 11px; margin: 3px 0; }
        .receipt-number { text-align: right; font-size: 14px; font-weight: bold; color: #1e293b; margin-bottom: 15px; }
        .info-box { background: #f1f5f9; padding: 12px; margin-bottom: 15px; border-radius: 4px; }
        .info-box h3 { margin: 0 0 8px 0; font-size: 13px; color: #1e293b; }
        .grid { display: table; width: 100%; }
        .grid-row { display: table-row; }
        .grid-label { display: table-cell; width: 40%; padding: 4px 0; color: #64748b; }
        .grid-value { display: table-cell; width: 60%; padding: 4px 0; font-weight: 600; }
        .amount-box { background: #ecfdf5; border: 2px solid #10b981; padding: 15px; text-align: center; margin: 20px 0; border-radius: 6px; }
        .amount-box .label { color: #065f46; font-size: 12px; }
        .amount-box .amount { color: #10b981; font-size: 26px; font-weight: bold; margin-top: 5px; }
        .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 10px; }
        .signature { margin-top: 50px; display: table; width: 100%; }
        .signature-cell { display: table-cell; width: 50%; text-align: center; padding: 0 20px; }
        .signature-line { border-top: 1px solid #94a3b8; margin-top: 40px; padding-top: 5px; font-size: 10px; color: #64748b; }
    </style>
</head>
<body>

    {{-- Encabezado --}}
    <div class="header">
        <h1>Funeraria Cristo Rey</h1>
        <p>Servicios Funerarios Integrales</p>
        <p>RUT: 76.543.210-K | Av. Principal 1234, Santiago</p>
    </div>

    {{-- Número de comprobante --}}
    <div class="receipt-number">
        Comprobante N° {{ $payment->receipt_number }}<br>
        <span style="font-size: 10px; color: #64748b;">
            Fecha: {{ $payment->payment_date->format('d/m/Y') }}
        </span>
    </div>

    {{-- Datos del servicio --}}
    <div class="info-box">
        <h3>Datos del Servicio</h3>
        <div class="grid">
            <div class="grid-row">
                <div class="grid-label">Código de servicio:</div>
                <div class="grid-value">{{ $service->code }}</div>
            </div>
            <div class="grid-row">
                <div class="grid-label">Tipo de servicio:</div>
                <div class="grid-value">{{ $service->serviceType->name }}</div>
            </div>
            <div class="grid-row">
                <div class="grid-label">Cliente:</div>
                <div class="grid-value">{{ $service->client->name }}</div>
            </div>
            <div class="grid-row">
                <div class="grid-label">RUT cliente:</div>
                <div class="grid-value">{{ $service->client->rut }}</div>
            </div>
            <div class="grid-row">
                <div class="grid-label">Fallecido:</div>
                <div class="grid-value">{{ $service->deceased->full_name }}</div>
            </div>
        </div>
    </div>

    {{-- Datos del pago --}}
    <div class="info-box">
        <h3>Detalle del Pago</h3>
        <div class="grid">
            <div class="grid-row">
                <div class="grid-label">Medio de pago:</div>
                <div class="grid-value">{{ $payment->payment_method_label }}</div>
            </div>
            @if ($payment->reference)
                <div class="grid-row">
                    <div class="grid-label">Referencia:</div>
                    <div class="grid-value">{{ $payment->reference }}</div>
                </div>
            @endif
        </div>
    </div>

    {{-- Monto --}}
    <div class="amount-box">
        <div class="label">MONTO ABONADO</div>
        <div class="amount">$ {{ number_format($payment->amount, 0, ',', '.') }}</div>
    </div>

    {{-- Estado financiero --}}
    <div class="info-box">
        <h3>Estado Financiero del Servicio</h3>
        <div class="grid">
            <div class="grid-row">
                <div class="grid-label">Total del servicio:</div>
                <div class="grid-value">$ {{ number_format($service->total_price, 0, ',', '.') }}</div>
            </div>
            <div class="grid-row">
                <div class="grid-label">Total abonado:</div>
                <div class="grid-value">$ {{ number_format($service->total_paid, 0, ',', '.') }}</div>
            </div>
            <div class="grid-row">
                <div class="grid-label">Saldo pendiente:</div>
                <div class="grid-value" style="color: {{ $service->balance > 0 ? '#dc2626' : '#10b981' }};">
                    $ {{ number_format($service->balance, 0, ',', '.') }}
                </div>
            </div>
        </div>
    </div>

    {{-- Firmas --}}
    <div class="signature">
        <div class="signature-cell">
            <div class="signature-line">Recibí conforme (Cliente)</div>
        </div>
        <div class="signature-cell">
            <div class="signature-line">Funeraria Cristo Rey</div>
        </div>
    </div>

    {{-- Footer --}}
    <div class="footer">
        <p>Este comprobante es un documento interno de la funeraria.</p>
        <p>Generado el {{ now()->format('d/m/Y \a \l\a\s H:i') }} por {{ $payment->registeredBy?->name ?? 'Sistema' }}</p>
    </div>

</body>
</html>