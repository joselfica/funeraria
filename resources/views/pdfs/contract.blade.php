<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Contrato - {{ $service->code }}</title>
    <style>
        @page { margin: 28px 36px; }
        body {
            font-family: Helvetica, Arial, sans-serif;
            font-size: 10px;
            color: #1f2937;
            line-height: 1.45;
            margin: 0;
        }

        /* Encabezado institucional */
        .header-table {
            width: 100%;
            border-bottom: 2px solid #7f1d1d;
            padding-bottom: 10px;
            margin-bottom: 14px;
        }
        .header-logo { width: 165px; }
        .company-info {
            text-align: right;
            font-size: 8.5px;
            color: #4b5563;
            line-height: 1.35;
        }
        .company-info strong {
            color: #7f1d1d;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* Banda de Título y Folio */
        .doc-banner {
            width: 100%;
            background: #fdf8f8;
            border: 1px solid #fecaca;
            border-left: 4px solid #7f1d1d;
            border-radius: 4px;
            padding: 9px 14px;
            margin-bottom: 14px;
        }
        .doc-banner-table { width: 100%; border-collapse: collapse; }
        .doc-title {
            font-size: 14px;
            font-weight: bold;
            color: #7f1d1d;
            letter-spacing: 0.8px;
            text-transform: uppercase;
        }
        .doc-subtitle {
            font-size: 8.5px;
            color: #6b7280;
            margin-top: 2px;
        }
        .doc-folio {
            text-align: right;
            vertical-align: middle;
        }
        .folio-badge {
            display: inline-block;
            background: #7f1d1d;
            color: #ffffff;
            padding: 4px 10px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: bold;
            letter-spacing: 0.5px;
        }

        /* Layout de 2 columnas para Contratante y Fallecido */
        .two-col-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 10px 0;
            margin: 0 -10px 12px -10px;
        }
        .col-card {
            width: 50%;
            vertical-align: top;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            padding: 10px 12px;
        }

        /* Secciones generales */
        .card {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            padding: 10px 14px;
            margin-bottom: 12px;
        }
        .section-header {
            font-size: 9.5px;
            font-weight: bold;
            color: #7f1d1d;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 4px;
            margin-bottom: 8px;
        }

        /* Filas clave-valor limpias */
        .kv-table { width: 100%; border-collapse: collapse; }
        .kv-table td {
            padding: 3px 0;
            vertical-align: top;
            font-size: 9.5px;
        }
        .kv-label {
            color: #6b7280;
            width: 38%;
        }
        .kv-value {
            color: #111827;
            font-weight: bold;
            width: 62%;
        }

        /* Bloque Económico */
        .finance-card {
            background: #fdf8f8;
            border: 1px solid #fecaca;
            border-radius: 4px;
            padding: 10px 14px;
            margin-bottom: 14px;
        }
        .finance-grid { width: 100%; border-collapse: collapse; }
        .finance-left { width: 58%; vertical-align: middle; }
        .finance-right {
            width: 42%;
            vertical-align: middle;
            text-align: right;
            border-left: 1px solid #fecaca;
            padding-left: 14px;
        }
        .total-label {
            font-size: 8.5px;
            text-transform: uppercase;
            color: #7f1d1d;
            font-weight: bold;
            letter-spacing: 0.5px;
        }
        .total-amount {
            font-size: 20px;
            font-weight: bold;
            color: #111827;
            margin: 2px 0;
        }
        .abono-text {
            font-size: 8.5px;
            color: #92400e;
            background: #fef3c7;
            border: 1px solid #fde68a;
            display: inline-block;
            padding: 2px 7px;
            border-radius: 3px;
            font-weight: bold;
        }

        /* Cláusula breve */
        .legal-note {
            font-size: 8.5px;
            color: #4b5563;
            text-align: justify;
            background: #f9fafb;
            border-left: 3px solid #9ca3af;
            padding: 7px 10px;
            margin-bottom: 18px;
        }

        /* Firmas */
        .signature-table {
            width: 100%;
            margin-top: 24px;
            page-break-inside: avoid;
        }
        .signature-cell {
            width: 50%;
            text-align: center;
            padding: 0 28px;
        }
        .signature-line {
            border-top: 1px solid #374151;
            margin-top: 38px;
            padding-top: 5px;
            font-size: 9.5px;
            font-weight: bold;
            color: #111827;
        }
        .signature-sub {
            font-size: 8px;
            color: #6b7280;
            margin-top: 1px;
        }

        /* Pie de página */
        .footer {
            margin-top: 18px;
            padding-top: 8px;
            border-top: 1px solid #e5e7eb;
            font-size: 8px;
            color: #9ca3af;
            text-align: center;
        }

        /* Sello de agua PAGADO */
        .stamp-paid {
            position: fixed;
            top: 340px;
            right: 55px;
            border: 5px solid #15803d;
            color: #15803d;
            padding: 12px 26px;
            font-size: 38px;
            font-weight: bold;
            transform: rotate(-18deg);
            opacity: 0.14;
            z-index: 999;
            letter-spacing: 4px;
            border-radius: 6px;
        }
    </style>
</head>
<body>

    @php
        $logoPath = public_path('images/logo-pdf.png');
        $logo = file_exists($logoPath)
            ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath))
            : null;
    @endphp

    @if ($service->is_fully_paid)
        <div class="stamp-paid">PAGADO</div>
    @endif

    {{-- Encabezado --}}
    <table class="header-table">
        <tr>
            <td>
                @if ($logo)
                    <img src="{{ $logo }}" class="header-logo" alt="Funeraria Cristo Rey">
                @else
                    <strong style="font-size: 18px; color: #7f1d1d;">FUNERARIA CRISTO REY</strong>
                @endif
            </td>
            <td class="company-info">
                <strong>Servicios Funerarios Integrales</strong><br>
                RUT: 76.543.210-K &bull; Blanco Encalada 142, Temuco, Araucanía<br>
                Tel: +56 9 6729 4759 &bull; Atención continua las 24 horas
            </td>
        </tr>
    </table>

    {{-- Título y Folio --}}
    <div class="doc-banner">
        <table class="doc-banner-table">
            <tr>
                <td>
                    <div class="doc-title">Contrato de Servicio Funerario</div>
                    <div class="doc-subtitle">Instrumento de prestación de servicios y condiciones comerciales</div>
                </td>
                <td class="doc-folio">
                    <span class="folio-badge">N° {{ $service->code }}</span>
                </td>
            </tr>
        </table>
    </div>

    {{-- Bloques 1 y 2 en paralelo --}}
    <table class="two-col-table">
        <tr>
            <td class="col-card">
                <div class="section-header">1. Datos del Contratante</div>
                <table class="kv-table">
                    <tr>
                        <td class="kv-label">Nombre:</td>
                        <td class="kv-value">{{ $service->client->name }}</td>
                    </tr>
                    <tr>
                        <td class="kv-label">RUT:</td>
                        <td class="kv-value">{{ $service->client->rut }}</td>
                    </tr>
                    <tr>
                        <td class="kv-label">Teléfono:</td>
                        <td class="kv-value">{{ $service->client->phone ?? '—' }}</td>
                    </tr>
                    <tr>
                        <td class="kv-label">Email:</td>
                        <td class="kv-value">{{ $service->client->email ?? '—' }}</td>
                    </tr>
                    <tr>
                        <td class="kv-label">Dirección:</td>
                        <td class="kv-value">{{ $service->client->address ?? '—' }}</td>
                    </tr>
                </table>
            </td>

            <td class="col-card">
                <div class="section-header">2. Datos del Fallecido</div>
                <table class="kv-table">
                    <tr>
                        <td class="kv-label">Nombre Completo:</td>
                        <td class="kv-value">{{ $service->deceased->full_name }}</td>
                    </tr>
                    <tr>
                        <td class="kv-label">RUT:</td>
                        <td class="kv-value">{{ $service->deceased->rut ?? '—' }}</td>
                    </tr>
                    <tr>
                        <td class="kv-label">F. Fallecimiento:</td>
                        <td class="kv-value">{{ \Carbon\Carbon::parse($service->deceased->death_date)->format('d/m/Y') }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    {{-- Bloque 3: Detalles del Servicio --}}
    <div class="card">
        <div class="section-header">3. Detalles y Logística del Servicio</div>
        <table class="kv-table">
            <tr>
                <td class="kv-label" style="width: 28%;">Tipo de Servicio:</td>
                <td class="kv-value" style="width: 72%;">{{ $service->service_type_label ?? '—' }}</td>
            </tr>
            <tr>
                <td class="kv-label">Sucursal Asignada:</td>
                <td class="kv-value">{{ $service->branch->name ?? 'No asignada' }}</td>
            </tr>
            <tr>
                <td class="kv-label">Inicio del Servicio:</td>
                <td class="kv-value">{{ \Carbon\Carbon::parse($service->scheduled_at)->format('d/m/Y H:i') }} hrs. (Duración estimada: {{ $service->duration_hours }} horas)</td>
            </tr>

            @if ($service->origin_location)
                <tr>
                    <td class="kv-label">Lugar de Origen / Retiro:</td>
                    <td class="kv-value">{{ $service->origin_location }}</td>
                </tr>
            @endif

            @if ($service->destination_location)
                <tr>
                    <td class="kv-label">Cementerio / Crematorio:</td>
                    <td class="kv-value">{{ $service->destination_location }}</td>
                </tr>
            @endif

            @if ($service->burial_at)
                <tr>
                    <td class="kv-label">Fecha Entierro / Cremación:</td>
                    <td class="kv-value">{{ \Carbon\Carbon::parse($service->burial_at)->format('d/m/Y H:i') }} hrs.</td>
                </tr>
            @endif
        </table>
    </div>

    {{-- Bloque 4: Información Económica --}}
    <div class="finance-card">
        <div class="section-header" style="border-bottom-color: #fecaca;">4. Condiciones Económicas</div>
        <table class="finance-grid">
            <tr>
                <td class="finance-left">
                    <table class="kv-table">
                        <tr>
                            <td class="kv-label" style="width: 42%;">Tipo de Beneficiario:</td>
                            <td class="kv-value" style="width: 58%;">{{ $service->beneficiary_label }}</td>
                        </tr>
                        <tr>
                            <td class="kv-label">Modalidad de Pago:</td>
                            <td class="kv-value">Abonos parciales hasta completar el total</td>
                        </tr>
                    </table>
                </td>
                <td class="finance-right">
                    <div class="total-label">Valor Total Contratado</div>
                    <div class="total-amount">$ {{ number_format($service->total_price, 0, ',', '.') }}</div>
                    <div class="abono-text">Abono mínimo (50%): $ {{ number_format($service->total_price * 0.5, 0, ',', '.') }}</div>
                </td>
            </tr>
        </table>
    </div>

    {{-- Nota de conformidad --}}
    <div class="legal-note">
        El contratante declara haber leído, comprendido y aceptado los términos y detalles descritos en el presente contrato, comprometiéndose al cumplimiento de las condiciones económicas acordadas con <strong>Funeraria Cristo Rey</strong>.
    </div>

    {{-- Firmas --}}
    <table class="signature-table">
        <tr>
            <td class="signature-cell">
                <div class="signature-line">{{ $service->client->name }}</div>
                <div class="signature-sub">RUT: {{ $service->client->rut }} &bull; Firma del Contratante</div>
            </td>
            <td class="signature-cell">
                <div class="signature-line">Funeraria Cristo Rey</div>
                <div class="signature-sub">Representante Autorizado</div>
            </td>
        </tr>
    </table>

    {{-- Footer --}}
    <div class="footer">
        Documento legal vinculante &bull; Código de verificación: {{ $service->code }} &bull; Emitido el {{ now()->format('d/m/Y \a \l\a\s H:i') }}
    </div>

</body>
</html>