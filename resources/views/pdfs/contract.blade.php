<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Contrato - {{ $service->code }}</title>
    <style>
        @page { margin: 32px 40px; }
        body { font-family: Helvetica, Arial, sans-serif; font-size: 11px; color: #333; line-height: 1.4; }
        .header { text-align: center; border-bottom: 2px solid #1e293b; padding-bottom: 8px; margin-bottom: 14px; }
        .header .logo { width: 210px; margin-bottom: 4px; }
        .header h1 { font-size: 20px; margin: 0; }
        .title { text-align: center; font-size: 16px; font-weight: bold; margin: 14px 0; }
        .section { margin-bottom: 10px; }
        .section-title { background: #f1f5f9; border-left: 4px solid #1e293b; padding: 5px 10px; font-weight: bold; font-size: 12px; margin-bottom: 8px; }
        .grid { display: table; width: 100%; }
        .row { display: table-row; }
        .cell-label { display: table-cell; width: 35%; padding: 3px 0; color: #64748b; }
        .cell-value { display: table-cell; width: 65%; padding: 3px 0; font-weight: bold; color: #1e293b; }
        .signature { margin-top: 30px; display: table; width: 100%; page-break-inside: avoid; }
        .signature-cell { display: table-cell; width: 50%; text-align: center; padding: 0 20px; }
        .signature-line { border-top: 1px solid #333; padding-top: 5px; margin-top: 40px; font-size: 10px; }
        .footer { margin-top: 20px; font-size: 9px; color: #94a3b8; text-align: center; }
        .stamp-paid {
            position: absolute;
            top: 300px;
            right: 60px;
            border: 6px solid #10b981;
            color: #10b981;
            padding: 15px 30px;
            font-size: 42px;
            font-weight: bold;
            transform: rotate(-20deg);
            opacity: 0.15;
            z-index: 999;
            letter-spacing: 5px;
        }
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

    {{-- Sello de PAGADO solo si el servicio está 100% pagado --}}
    @if ($service->is_fully_paid)
        <div class="stamp-paid">PAGADO</div>
    @endif


    <div class="header">
        @if ($logo)
            <img src="{{ $logo }}" class="logo" alt="Funeraria Cristo Rey">
        @else
            <h1>Funeraria Cristo Rey</h1>
        @endif
        <p>RUT: 76.543.210-K | Blanco Encalada 142, Temuco, Araucanía</p>
        <p>Tel: +56 9 6729 4759 | Atención las 24 horas</p>
    </div>

    <div class="title">CONTRATO DE SERVICIO FUNERARIO</div>

    <div class="section">
        <div class="section-title">1. DATOS DEL CONTRATANTE</div>
        <div class="grid">
            <div class="row"><div class="cell-label">Nombre:</div><div class="cell-value">{{ $service->client->name }}</div></div>
            <div class="row"><div class="cell-label">RUT:</div><div class="cell-value">{{ $service->client->rut }}</div></div>
            <div class="row"><div class="cell-label">Teléfono:</div><div class="cell-value">{{ $service->client->phone ?? '—' }}</div></div>
            <div class="row"><div class="cell-label">Email:</div><div class="cell-value">{{ $service->client->email ?? '—' }}</div></div>
            <div class="row"><div class="cell-label">Dirección:</div><div class="cell-value">{{ $service->client->address ?? '—' }}</div></div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">2. DATOS DEL FALLECIDO</div>
        <div class="grid">
            <div class="row"><div class="cell-label">Nombre:</div><div class="cell-value">{{ $service->deceased->full_name }}</div></div>
            <div class="row"><div class="cell-label">RUT:</div><div class="cell-value">{{ $service->deceased->rut ?? '—' }}</div></div>
            <div class="row"><div class="cell-label">Fecha de Fallecimiento:</div><div class="cell-value">{{ \Carbon\Carbon::parse($service->deceased->death_date)->format('d/m/Y') }}</div></div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">3. DETALLES DEL SERVICIO</div>
        <div class="grid">
            <div class="row"><div class="cell-label">Código:</div><div class="cell-value">{{ $service->code }}</div></div>
            <div class="row"><div class="cell-label">Tipo de Servicio:</div><div class="cell-value">{{ $service->service_type_label ?? '—' }}</div></div>
            <div class="row"><div class="cell-label">Sucursal:</div><div class="cell-value">{{ $service->branch->name ?? 'No asignada' }}</div></div>
            <div class="row"><div class="cell-label">Fecha de Inicio:</div><div class="cell-value">{{ \Carbon\Carbon::parse($service->scheduled_at)->format('d/m/Y H:i') }}</div></div>
            <div class="row"><div class="cell-label">Duración:</div><div class="cell-value">{{ $service->duration_hours }} horas</div></div>
            {{-- NUEVOS CAMPOS --}}
            @if ($service->origin_location)
                <div class="row"><div class="cell-label">Lugar de origen del fallecido:</div><div class="cell-value">{{ $service->origin_location }}</div></div>
            @endif

            @if ($service->destination_location)
                <div class="row"><div class="cell-label">Cementerio / Crematorio:</div><div class="cell-value">{{ $service->destination_location }}</div></div>
            @endif

            @if ($service->burial_at)
                <div class="row"><div class="cell-label">Fecha de Entierro / Cremación:</div><div class="cell-value">{{ \Carbon\Carbon::parse($service->burial_at)->format('d/m/Y H:i') }}</div></div>
            @endif
        </div>
    </div>

    <div class="section">
        <div class="section-title">4. INFORMACIÓN ECONÓMICA</div>
        <div class="grid">
            <div class="row"><div class="cell-label">Tipo de Beneficiario:</div><div class="cell-value">{{ $service->beneficiary_label }}</div></div>
            <div class="row"><div class="cell-label">Monto Total:</div><div class="cell-value">$ {{ number_format($service->total_price, 0, ',', '.') }}</div></div>
            <div class="row"><div class="cell-label">Abono Mínimo (50%):</div><div class="cell-value">$ {{ number_format($service->total_price * 0.5, 0, ',', '.') }}</div></div>
            <div class="row"><div class="cell-label">Forma de Pago:</div><div class="cell-value">Abonos parciales hasta completar el total</div></div>
        </div>
    </div>

    <div class="signature">
        <div class="signature-cell">
            <div class="signature-line">Firma del Contratante</div>
        </div>
        <div class="signature-cell">
            <div class="signature-line">Funeraria Cristo Rey</div>
        </div>
    </div>

    <div class="footer">
        <p>Este contrato es un documento legal vinculante. {{ $service->code }} - {{ now()->format('d/m/Y') }}</p>
    </div>

</body>
</html>