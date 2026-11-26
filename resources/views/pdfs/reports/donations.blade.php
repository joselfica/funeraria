<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte de Donaciones</title>
    <style>
        /*
         * PALETA OFICIAL FUNERARIA CRISTO REY:
         *   Principal ........ #901c1f
         *   Fondo suave ...... #fdf2f2
         *   Línea suave ...... #e5b9ba
         */
        @page { margin: 26px 32px; }
        body { font-family: Helvetica, Arial, sans-serif; font-size: 9.5px; color: #1f2937; }
        table { border-collapse: collapse; }

        /* ───── Encabezado ───── */
        .head { width: 100%; border-bottom: 1px solid #e5b9ba; padding-bottom: 10px; }
        .head td { vertical-align: top; }
        .brand-text { font-family: 'Times New Roman', Times, serif; font-size: 20px; font-weight: bold; color: #901c1f; }
        .logo { width: 165px; }
        .brand-info { font-size: 9px; color: #374151; margin-top: 4px; line-height: 1.4; }

        .badge-doc { border: 1px solid #901c1f; background: #fdf2f2; border-radius: 6px; padding: 7px 12px; text-align: center; font-size: 12px; font-weight: bold; color: #901c1f; line-height: 1.25; }
        .meta { text-align: right; margin-top: 6px; font-size: 9.5px; color: #374151; }

        /* ───── Tarjeta Resumen ───── */
        .summary { margin-top: 14px; margin-bottom: 14px; border: 1px solid #901c1f; background: #fdf2f2; border-radius: 6px; padding: 10px 14px; }
        .summary table { width: 100%; }
        .summary-label { font-size: 10.5px; font-weight: bold; color: #901c1f; text-transform: uppercase; }
        .summary-sub { font-size: 8.5px; color: #4b5563; margin-top: 2px; }
        .summary-val { font-size: 17px; font-weight: bold; color: #111827; text-align: right; vertical-align: middle; }

        /* ───── Tabla Principal ───── */
        .data { width: 100%; font-size: 8.5px; }
        .data th { background: #901c1f; color: #ffffff; padding: 6px 6px; text-align: left; font-size: 8px; text-transform: uppercase; letter-spacing: 0.3px; }
        .data td { padding: 6px; border-bottom: 1px solid #e5e7eb; vertical-align: middle; }
        .data tr:nth-child(even) td { background: #fafafa; }
        .data tr.total-row td { background: #fdf2f2; border-top: 1px solid #901c1f; border-bottom: 1px solid #901c1f; color: #901c1f; font-weight: bold; font-size: 9.5px; }

        /* ───── Etiquetas de Tipo ───── */
        .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 7.5px; font-weight: bold; }
        .badge-dinero { background-color: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
        .badge-especie { background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a; }

        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: bold; }

        .footer { position: fixed; bottom: 12px; left: 32px; right: 32px; border-top: 1px solid #e5b9ba; padding-top: 5px; text-align: center; font-size: 8.5px; color: #4b5563; }
    </style>
</head>
<body>

    @php
        $logoPath = public_path('images/logo-pdf.png');
        $logo = file_exists($logoPath)
            ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath))
            : null;
    @endphp

    {{-- ───────── Encabezado ───────── --}}
    <table class="head">
        <tr>
            <td style="width: 62%;">
                @if ($logo)
                    <img src="{{ $logo }}" class="logo" alt="Funeraria Cristo Rey">
                @else
                    <div class="brand-text">Funeraria Cristo Rey</div>
                @endif
                <div class="brand-info">
                    RUT: 76.543.210-K · Blanco Encalada 142, Temuco, Araucanía<br>
                    Tel: +56 9 6729 4759 · Atención las 24 horas
                </div>
            </td>
            <td style="width: 38%;">
                <div class="badge-doc">REPORTE DE<br>DONACIONES</div>
                <div class="meta">
                    @if ($startDate && $endDate)
                        Período: <strong>{{ \Carbon\Carbon::parse($startDate)->format('d/m/Y') }}</strong> al <strong>{{ \Carbon\Carbon::parse($endDate)->format('d/m/Y') }}</strong>
                    @else
                        <strong>Historial completo</strong>
                    @endif
                </div>
            </td>
        </tr>
    </table>

    {{-- ───────── Resumen ───────── --}}
    <div class="summary">
        <table>
            <tr>
                <td>
                    <div class="summary-label">Total donado en dinero</div>
                    <div class="summary-sub">Registros listados en el período: {{ $donations->count() }}</div>
                </td>
                <td class="summary-val">$ {{ number_format($totalDinero ?? 0, 0, ',', '.') }}</td>
            </tr>
        </table>
    </div>

    {{-- ───────── Tabla de Donaciones ───────── --}}
    <table class="data">
        <thead>
            <tr>
                <th style="width: 11%;">Fecha</th>
                <th style="width: 30%;">Beneficiario</th>
                <th class="center" style="width: 11%;">Tipo</th>
                <th style="width: 31%;">Detalle / Monto</th>
                <th style="width: 17%;">Registrado por</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($donations as $d)
                <tr>
                    <td>{{ $d->donation_date->format('d/m/Y') }}</td>
                    <td>
                        <strong>{{ $d->beneficiary_name }}</strong>
                        @if ($d->contact_person)
                            <br><span style="color: #6b7280; font-size: 7.5px;">Contacto: {{ $d->contact_person }}</span>
                        @endif
                    </td>
                    <td class="center">
                        @if ($d->type === 'dinero')
                            <span class="badge badge-dinero">DINERO</span>
                        @else
                            <span class="badge badge-especie">ESPECIE</span>
                        @endif
                    </td>
                    <td>
                        @if ($d->type === 'dinero')
                            <span class="bold" style="color: #065f46;">$ {{ number_format($d->amount, 0, ',', '.') }}</span>
                        @else
                            {{ $d->description }}
                        @endif
                    </td>
                    <td>{{ $d->creator?->name ?? 'Sistema' }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="5" class="center" style="padding: 20px; color: #6b7280;">
                        No hay donaciones registradas en este período.
                    </td>
                </tr>
            @endforelse

            @if ($donations->count() > 0 && ($totalDinero ?? 0) > 0)
                <tr class="total-row">
                    <td colspan="3" class="right">TOTAL APORTES EN DINERO:</td>
                    <td colspan="2">$ {{ number_format($totalDinero, 0, ',', '.') }}</td>
                </tr>
            @endif
        </tbody>
    </table>

    {{-- ───────── Pie de página ───────── --}}
    <div class="footer">
        Funeraria Cristo Rey · Generado el {{ now()->format('d/m/Y \a \l\a\s H:i') }} por {{ auth()->user()->name ?? 'Sistema' }}
    </div>

</body>
</html>