@php
    // Convertir le tableau de widgets en map indexée par type + ordre
    $widgetMap   = [];
    $widgetOrder = [];
    foreach (($styles ?? []) as $widget) {
        if (!isset($widget['type'])) continue;
        $widgetMap[$widget['type']] = $widget;
        if ($widget['visible'] ?? true) {
            $widgetOrder[] = $widget;
        }
    }
    usort($widgetOrder, fn($a, $b) => ($a['order'] ?? 99) <=> ($b['order'] ?? 99));

    // Fallback si aucun widget n'est défini (ancienne structure)
    if (empty($widgetOrder)) {
        $widgetOrder = [
            ['type' => 'company_info',     'style' => [], 'visible' => true, 'order' => 1],
            ['type' => 'employee_info',    'style' => [], 'visible' => true, 'order' => 2],
            ['type' => 'earnings_table',   'style' => [], 'visible' => true, 'order' => 3],
            ['type' => 'summary_box',      'style' => [], 'visible' => true, 'order' => 4],
            ['type' => 'payment_info',     'style' => [], 'visible' => true, 'order' => 5],
        ];
    }
@endphp
<!doctype html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <style>
        * { margin: 0; padding: 0; }
        @page { margin: 20px 20px; }
        body { font-family: Liberation Sans, DejaVu Sans, sans-serif; font-size: 11px; color: #1a1a1a; line-height: 1.4; }
        .container { width: 100%; }
        .box-title { font-size: 12px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin-bottom: 4px; }
        .box-item { margin: 2px 0; font-size: 10px; }
        .label { font-weight: bold; }
        .right { text-align: right; padding-right: 6px; }
        .center { text-align: center; }
        .left { text-align: left; }
        .logo { max-height: 40px; max-width: 100px; margin-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    </style>
</head>
<body>
<div class="container">

    <!-- Titre -->
    <div style="font-size: 18px; font-weight: bold; text-align: center; margin: 10px 0 8px 0;">
        FICHE DE PAIE
    </div>
    <div style="text-align: center; font-size: 12px; margin-bottom: 12px; font-weight: bold;">
        Période : {{ str_pad((string)$payroll->period_month, 2, '0', STR_PAD_LEFT) }}/{{ $payroll->period_year }}
    </div>

    @foreach($widgetOrder as $widget)
        @php $type = $widget['type']; $s = $widget['style'] ?? []; @endphp

        {{-- ENTREPRISE --}}
        @if($type === 'company_info')
            <div style="
                background-color: {{ $s['backgroundColor'] ?? '#fafafa' }};
                border: {{ $s['borderWidth'] ?? '1px' }} solid {{ $s['borderColor'] ?? '#999' }};
                padding: {{ $s['padding'] ?? '8px' }};
                border-radius: {{ $s['borderRadius'] ?? '0px' }};
                font-family: {{ $s['fontFamily'] ?? 'Liberation Sans, sans-serif' }};
                margin-bottom: 10px;
            ">
                <div class="box-title">ENTREPRISE</div>
                @if($logoDataUri)
                    <img class="logo" src="{{ $logoDataUri }}" alt="Logo">
                @endif
                <div class="box-item"><span class="label">Nom:</span> {{ addslashes($settings->company_name ?? 'N/A') }}</div>
                <div class="box-item"><span class="label">Propriétaire:</span> {{ addslashes($settings->owner_name ?? 'N/A') }}</div>
                <div class="box-item"><span class="label">NIF:</span> {{ addslashes($settings->nif ?? 'N/A') }}</div>
                <div class="box-item"><span class="label">STAT:</span> {{ addslashes($settings->stat ?? 'N/A') }}</div>
                <div class="box-item"><span class="label">RCS:</span> {{ addslashes($settings->rcs ?? 'N/A') }}</div>
            </div>

        {{-- EMPLOYÉ --}}
        @elseif($type === 'employee_info')
            <div style="
                background-color: {{ $s['backgroundColor'] ?? '#fafafa' }};
                border: {{ $s['borderWidth'] ?? '1px' }} solid {{ $s['borderColor'] ?? '#999' }};
                padding: {{ $s['padding'] ?? '8px' }};
                border-radius: {{ $s['borderRadius'] ?? '0px' }};
                font-family: {{ $s['fontFamily'] ?? 'Liberation Sans, sans-serif' }};
                margin-bottom: 10px;
            ">
                <div class="box-title">EMPLOYÉ</div>
                <div class="box-item"><span class="label">Nom:</span> {{ addslashes($employee->last_name ?? 'N/A') }}</div>
                <div class="box-item"><span class="label">Prénom:</span> {{ addslashes($employee->first_name ?? 'N/A') }}</div>
                <div class="box-item"><span class="label">Poste:</span> {{ addslashes($employee->position ?? 'N/A') }}</div>
                <div class="box-item"><span class="label">Matricule:</span> EMP-{{ str_pad((string)$employee->id, 5, '0', STR_PAD_LEFT) }}</div>
                <div class="box-item"><span class="label">Embauche:</span> {{ $employee->hire_date ? $employee->hire_date->format('d/m/Y') : 'N/A' }}</div>
            </div>

        {{-- TABLEAU DES GAINS + RETENUES --}}
        @elseif($type === 'earnings_table')
            <table style="margin-bottom: 10px;">
                <thead>
                    <tr>
                        <th style="width:6%;   border: 1px solid {{ $s['headerBorderColor'] ?? '#999' }}; background-color: {{ $s['headerBackgroundColor'] ?? '#e0e0e0' }}; font-size: {{ $s['headerFontSize'] ?? '10px' }}; font-weight: {{ $s['headerFontWeight'] ?? 'bold' }};">N</th>
                        <th style="width:32%;  border: 1px solid {{ $s['headerBorderColor'] ?? '#999' }}; background-color: {{ $s['headerBackgroundColor'] ?? '#e0e0e0' }}; font-size: {{ $s['headerFontSize'] ?? '10px' }}; font-weight: {{ $s['headerFontWeight'] ?? 'bold' }};">Désignation</th>
                        <th style="width:14%;  border: 1px solid {{ $s['headerBorderColor'] ?? '#999' }}; background-color: {{ $s['headerBackgroundColor'] ?? '#e0e0e0' }}; font-size: {{ $s['headerFontSize'] ?? '10px' }}; font-weight: {{ $s['headerFontWeight'] ?? 'bold' }};">Base</th>
                        <th style="width:12%;  border: 1px solid {{ $s['headerBorderColor'] ?? '#999' }}; background-color: {{ $s['headerBackgroundColor'] ?? '#e0e0e0' }}; font-size: {{ $s['headerFontSize'] ?? '10px' }}; font-weight: {{ $s['headerFontWeight'] ?? 'bold' }};">Taux</th>
                        <th style="width:18%;  border: 1px solid {{ $s['headerBorderColor'] ?? '#999' }}; background-color: {{ $s['headerBackgroundColor'] ?? '#e0e0e0' }}; font-size: {{ $s['headerFontSize'] ?? '10px' }}; font-weight: {{ $s['headerFontWeight'] ?? 'bold' }};">Gain (Ar)</th>
                        <th style="width:18%;  border: 1px solid {{ $s['headerBorderColor'] ?? '#999' }}; background-color: {{ $s['headerBackgroundColor'] ?? '#e0e0e0' }}; font-size: {{ $s['headerFontSize'] ?? '10px' }}; font-weight: {{ $s['headerFontWeight'] ?? 'bold' }};">Retenu (Ar)</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($lines as $line)
                        <tr>
                            <td class="center" style="border: 1px solid {{ $s['bodyBorderColor'] ?? '#999' }}; font-size: {{ $s['bodyFontSize'] ?? '10px' }};">{{ $line['numero'] }}</td>
                            <td class="left"   style="border: 1px solid {{ $s['bodyBorderColor'] ?? '#999' }}; font-size: {{ $s['bodyFontSize'] ?? '10px' }};">{{ addslashes($line['designation'] ?? '') }}</td>
                            <td class="right"  style="border: 1px solid {{ $s['bodyBorderColor'] ?? '#999' }}; font-size: {{ $s['bodyFontSize'] ?? '10px' }};">{{ number_format((float)$line['base'], 0, '.', ' ') }}</td>
                            <td class="center" style="border: 1px solid {{ $s['bodyBorderColor'] ?? '#999' }}; font-size: {{ $s['bodyFontSize'] ?? '10px' }};">{{ addslashes($line['taux'] ?? '-') }}</td>
                            <td class="right"  style="border: 1px solid {{ $s['bodyBorderColor'] ?? '#999' }}; font-size: {{ $s['bodyFontSize'] ?? '10px' }};">{{ number_format((float)$line['gain'], 0, '.', ' ') }}</td>
                            <td class="right"  style="border: 1px solid {{ $s['bodyBorderColor'] ?? '#999' }}; font-size: {{ $s['bodyFontSize'] ?? '10px' }};">{{ number_format((float)$line['retenu'], 0, '.', ' ') }}</td>
                        </tr>
                    @endforeach
                    <tr style="background-color: {{ $s['backgroundColor'] ?? '#f0f0f0' }}; font-weight: bold;">
                        <td colspan="4" class="right" style="border: 1px solid {{ $s['bodyBorderColor'] ?? '#999' }};">Salaire Brut</td>
                        <td class="right"             style="border: 1px solid {{ $s['bodyBorderColor'] ?? '#999' }};">{{ number_format((float)$payroll->gross_salary, 0, '.', ' ') }}</td>
                        <td class="right"             style="border: 1px solid {{ $s['bodyBorderColor'] ?? '#999' }};">-</td>
                    </tr>
                    <tr style="background-color: {{ $s['backgroundColor'] ?? '#f0f0f0' }}; font-weight: bold;">
                        <td colspan="4" class="right" style="border: 1px solid {{ $s['bodyBorderColor'] ?? '#999' }};">Total Retenu</td>
                        <td class="right"             style="border: 1px solid {{ $s['bodyBorderColor'] ?? '#999' }};">-</td>
                        <td class="right"             style="border: 1px solid {{ $s['bodyBorderColor'] ?? '#999' }};">{{ number_format((float)$payroll->total_retenu, 0, '.', ' ') }}</td>
                    </tr>
                    <tr style="background-color: {{ $s['backgroundColor'] ?? '#f0f0f0' }}; font-weight: bold; font-size: 12px;">
                        <td colspan="4" class="right" style="border: 1px solid {{ $s['bodyBorderColor'] ?? '#999' }};">NET À PAYER</td>
                        <td colspan="2" class="right" style="border: 1px solid {{ $s['bodyBorderColor'] ?? '#999' }};">{{ number_format((float)$payroll->net_to_pay, 0, '.', ' ') }}</td>
                    </tr>
                </tbody>
            </table>

        {{-- RÉSUMÉ --}}
        @elseif($type === 'summary_box')
            <div style="
                background-color: {{ $s['backgroundColor'] ?? '#f0f0f0' }};
                padding: {{ $s['padding'] ?? '10px' }};
                margin-bottom: 10px;
                font-size: {{ $s['fontSize'] ?? '11px' }};
                font-weight: {{ $s['fontWeight'] ?? 'bold' }};
            ">
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                    <span>Salaire Brut :</span>
                    <span>{{ number_format((float)$payroll->gross_salary, 0, '.', ' ') }} Ar</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                    <span>Total Retenu :</span>
                    <span>{{ number_format((float)$payroll->total_retenu, 0, '.', ' ') }} Ar</span>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:13px;">
                    <span>NET À PAYER :</span>
                    <span>{{ number_format((float)$payroll->net_to_pay, 0, '.', ' ') }} Ar</span>
                </div>
            </div>

        {{-- PAIEMENT --}}
        @elseif($type === 'payment_info')
            <div style="
                background-color: {{ $s['backgroundColor'] ?? '#fafafa' }};
                border: {{ $s['borderWidth'] ?? '1px' }} solid {{ $s['borderColor'] ?? '#999' }};
                padding: {{ $s['padding'] ?? '8px' }};
                margin-top: {{ $s['marginTop'] ?? '18px' }};
            ">
                <div class="box-title">INFORMATIONS DE PAIEMENT</div>
                <div class="box-item"><span class="label">Mode :</span> {{ addslashes($payroll->payment_method ?? 'N/A') }}</div>
                <div class="box-item"><span class="label">Statut :</span> {{ $payroll->payment_status === 'paid' ? 'PAYÉ' : 'NON PAYÉ' }}</div>
                <div class="box-item"><span class="label">Date paiement :</span> {{ $payroll->paid_at ? $payroll->paid_at->format('d/m/Y') : 'N/A' }}</div>
                @if($payroll->notes)
                    <div class="box-item"><span class="label">Notes :</span> {{ addslashes($payroll->notes) }}</div>
                @endif
            </div>
        @endif

    @endforeach
</div>
</body>
</html>
