<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Comprobante {{ $payment->receipt_number }}</title>
    <style>
        /*
         * COLORES DE LA FUNERARIA (cambiar aquí si el burdeos no coincide):
         *   Principal ........ #901c1f  (rojo del logo)
         *   Fondo suave ...... #fdf2f2
         *   Línea suave ...... #e5b9ba
         */
        @page { margin: 32px 38px; }
        body { font-family: Helvetica, Arial, sans-serif; font-size: 12px; color: #1f2937; }
        table { border-collapse: collapse; }

        /* ───── Encabezado ───── */
        .head { width: 100%; }
        .head td { vertical-align: top; }

        .brand-text { font-family: 'Times New Roman', Times, serif; font-size: 24px; font-weight: bold; color: #901c1f; }
        .logo { width: 200px; }
        .brand-info { font-size: 11px; color: #374151; margin-top: 6px; line-height: 1.5; }

        .badge { border: 1px solid #901c1f; background: #fdf2f2; border-radius: 6px; padding: 9px 14px; text-align: center; font-size: 14px; font-weight: bold; color: #901c1f; line-height: 1.25; }
        .receipt-meta { text-align: right; margin-top: 8px; font-size: 12px; line-height: 1.5; }
        .receipt-meta strong { font-size: 13px; }

        /* ───── Secciones ───── */
        .section-title { margin-top: 22px; padding-bottom: 3px; border-bottom: 1px solid #e5b9ba; font-size: 14px; font-weight: bold; text-transform: uppercase; color: #901c1f; }
        .rows { width: 100%; margin-top: 8px; }
        .rows td { padding: 4px 0; }
        .label { width: 32%; font-weight: bold; color: #111827; }

        /* ───── Monto ───── */
        .amount { margin-top: 22px; border: 1px solid #901c1f; background: #fdf2f2; border-radius: 6px; padding: 12px; text-align: center; font-size: 19px; font-weight: bold; color: #111827; }

        /* ───── Firmas ───── */
        .sign { width: 100%; margin-top: 70px; }
        .sign td { width: 50%; text-align: center; padding: 0 22px; vertical-align: top; }
        .sign-line { border-top: 1px dotted #6b7280; padding-top: 6px; font-size: 12px; color: #374151; }

        .footer { margin-top: 38px; text-align: center; font-size: 10px; color: #4b5563; line-height: 1.6; }
    </style>
</head>
<body>

    {{-- ───────── Encabezado ───────── --}}
    <table class="head">
        <tr>
            <td style="width: 60%;">
                @php
                    // Logo embebido en base64 (evita problemas de rutas en dompdf).
                    // Debe ser liviano: ver public/images/logo-pdf.png (~12 KB).
                    $logoPath = public_path('images/logo-pdf.png');
                    $logo = file_exists($logoPath)
                        ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath))
                        : null;
                @endphp
                @if ($logo)
                    <img src="{{ $logo }}" class="logo" alt="Funeraria Cristo Rey">
                @else
                    <div class="brand-text">Funeraria Cristo Rey</div>
                @endif
                <div class="brand-info">
                    Servicios Funerarios Integrales<br>
                    RUT: 76.543.210-K<br>
                    Blanco Encalada 142, Temuco, Araucanía<br>
                    Tel: +56 9 6729 4759 · Atención las 24 horas
                </div>
            </td>
            <td style="width: 40%;">
                <div class="badge">COMPROBANTE<br>DE ABONO</div>
                <div class="receipt-meta">
                    <strong>N° {{ $payment->receipt_number }}</strong><br>
                    Fecha: {{ $payment->payment_date->format('d/m/Y') }}
                </div>
            </td>
        </tr>
    </table>

    {{-- ───────── Datos del servicio ───────── --}}
    <div class="section-title">Datos del servicio</div>
    <table class="rows">
        <tr><td class="label">Código de servicio:</td><td>{{ $service->code }}</td></tr>
        <tr><td class="label">Tipo de servicio:</td><td>{{ $service->service_type_label ?? '—' }}</td></tr>
        <tr><td class="label">Cliente:</td><td>{{ $service->client?->name ?? '—' }}</td></tr>
        <tr><td class="label">RUT cliente:</td><td>{{ $service->client?->rut ?? '—' }}</td></tr>
        <tr><td class="label">Fallecido:</td><td>{{ $service->deceased?->full_name ?? '—' }}</td></tr>
    </table>

    {{-- ───────── Detalle de la transacción ───────── --}}
    <div class="section-title">Detalle de la transacción</div>
    <table class="rows">
        <tr><td class="label">Medio de pago:</td><td>{{ $payment->payment_method_label }}</td></tr>
        @if ($payment->reference)
            <tr><td class="label">Referencia:</td><td>{{ $payment->reference }}</td></tr>
        @endif
    </table>

    {{-- ───────── Monto ───────── --}}
    <div class="amount">MONTO ABONADO: $ {{ number_format($payment->amount, 0, ',', '.') }}</div>

    {{-- ───────── Estado financiero ───────── --}}
    <div class="section-title">Estado financiero del servicio</div>
    <table class="rows">
        <tr><td class="label">Total del servicio:</td><td>$ {{ number_format($service->total_price, 0, ',', '.') }}</td></tr>
        <tr><td class="label">Total acumulado:</td><td>$ {{ number_format($service->total_paid, 0, ',', '.') }}</td></tr>
        <tr>
            <td class="label">Saldo pendiente:</td>
            <td style="font-weight: bold; color: {{ $service->balance > 0 ? '#901c1f' : '#15803d' }};">
                $ {{ number_format($service->balance, 0, ',', '.') }}
            </td>
        </tr>
    </table>

    {{-- ───────── Firmas ───────── --}}
    <table class="sign">
        <tr>
            <td><div class="sign-line">Recibí conforme<br>(Cliente)</div></td>
            <td><div class="sign-line">Firma autorizada</div></td>
        </tr>
    </table>

    {{-- ───────── Pie ───────── --}}
    <div class="footer">
        Este comprobante es un documento interno de la funeraria.<br>
        Generado el {{ now()->format('d/m/Y \a \l\a\s H:i') }} por {{ $payment->registeredBy?->name ?? 'Sistema' }}
    </div>

</body>
</html>