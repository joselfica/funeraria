<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Certificado de Paz y Salvo - {{ $service->code }}</title>
    <style>
        @page { margin: 40px; }
        body { font-family: Helvetica, Arial, sans-serif; font-size: 12px; color: #333; line-height: 1.6; }
        .header { text-align: center; border-bottom: 3px solid #10b981; padding-bottom: 15px; margin-bottom: 30px; }
        .header .logo { width: 230px; margin-bottom: 6px; }
        .header h1 { color: #1e293b; font-size: 22px; margin: 0; }
        .header p { color: #64748b; font-size: 11px; margin: 3px 0; }
        .title { text-align: center; font-size: 18px; font-weight: bold; color: #10b981; margin: 30px 0; text-transform: uppercase; letter-spacing: 2px; }
        .content { margin: 20px 0; text-align: justify; }
        .info-box { background: #f8fafc; padding: 15px; margin: 20px 0; border-left: 4px solid #10b981; }
        .info-row { display: flex; justify-content: space-between; padding: 4px 0; }
        .info-label { color: #64748b; }
        .info-value { font-weight: bold; }
        .total-box { background: #ecfdf5; border: 2px solid #10b981; padding: 20px; text-align: center; margin: 30px 0; border-radius: 6px; }
        .total-box .label { color: #065f46; font-size: 14px; }
        .total-box .amount { color: #10b981; font-size: 32px; font-weight: bold; margin-top: 8px; }
        .signature { margin-top: 60px; display: flex; justify-content: space-around; }
        .signature-line { border-top: 1px solid #94a3b8; padding-top: 8px; width: 200px; text-align: center; font-size: 11px; color: #64748b; }
        .footer { margin-top: 50px; padding-top: 15px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 10px; }
        .stamp { position: absolute; top: 200px; right: 50px; border: 3px solid #10b981; color: #10b981; padding: 10px 20px; font-size: 24px; font-weight: bold; transform: rotate(-15deg); opacity: 0.3; }
    </style>
</head>
<body>

    @php
        // Logo embebido en base64 (evita problemas de rutas en dompdf)
        $logoPath = public_path('images/logo-pdf.png');
        $logo = file_exists($logoPath)
            ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath))
            : null;
    @endphp

    <div class="stamp">PAGADO</div>

    <div class="header">
        @if ($logo)
            <img src="{{ $logo }}" class="logo" alt="Funeraria Cristo Rey">
        @else
            <h1>Funeraria Cristo Rey</h1>
        @endif
        <p>Servicios Funerarios Integrales</p>
        <p>RUT: 76.543.210-K | Blanco Encalada 142, Temuco, Araucanía</p>
        <p>Tel: +56 9 6729 4759 | Atención las 24 horas</p>
    </div>

    <div class="title">Certificado de Paz y Salvo</div>

    <div class="content">
        <p>Por medio del presente documento, <strong>Funeraria Cristo Rey</strong> certifica que el servicio funerario detallado a continuación ha sido <strong>totalmente cancelado</strong> por el contratante, no existiendo deuda pendiente alguna a la fecha de emisión.</p>
    </div>

    <div class="info-box">
        <div class="info-row">
            <span class="info-label">Código de Servicio:</span>
            <span class="info-value">{{ $service->code }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Contratante:</span>
            <span class="info-value">{{ $service->client->name }} ({{ $service->client->rut }})</span>
        </div>
        <div class="info-row">
            <span class="info-label">Fallecido:</span>
            <span class="info-value">{{ $service->deceased->full_name }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Tipo de Servicio:</span>
            <span class="info-value">{{ $service->serviceType->name }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Fecha de Servicio:</span>
            <span class="info-value">{{ \Carbon\Carbon::parse($service->scheduled_at)->format('d/m/Y') }}</span>
        </div>
        {{-- NUEVOS CAMPOS --}}
        @if ($service->origin_location)
            <div class="info-row">
                <span class="info-label">Lugar de origen:</span>
                <span class="info-value">{{ $service->origin_location }}</span>
            </div>
        @endif

        @if ($service->destination_location)
            <div class="info-row">
                <span class="info-label">Cementerio / Crematorio:</span>
                <span class="info-value">{{ $service->destination_location }}</span>
            </div>
        @endif

        @if ($service->burial_at)
            <div class="info-row">
                <span class="info-label">Entierro / Cremación:</span>
                <span class="info-value">{{ \Carbon\Carbon::parse($service->burial_at)->format('d/m/Y H:i') }}</span>
            </div>
        @endif
    </div>

    <div class="total-box">
        <div class="label">TOTAL CANCELADO</div>
        <div class="amount">$ {{ number_format($service->total_price, 0, ',', '.') }}</div>
    </div>

    <div class="content">
        <p>Se emite el presente certificado para los fines que el contratante estime convenientes.</p>
    </div>

    <div class="signature">
        <div class="signature-line">Funeraria Cristo Rey</div>
        <div class="signature-line">Recibí Conforme (Cliente)</div>
    </div>

    <div class="footer">
        <p>Generado el {{ now()->format('d/m/Y \a \l\a\s H:i') }}</p>
        <p>Documento válido como comprobante de pago total</p>
    </div>

</body>
</html>