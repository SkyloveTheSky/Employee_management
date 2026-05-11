@php
    $margins = $margins ?? ['top' => 20, 'bottom' => 20, 'left' => 20, 'right' => 20];

    $widgetOrder = [];
    foreach (($styles ?? []) as $widget) {
        if (!is_array($widget) || !isset($widget['type'])) continue;
        $visible = isset($widget['visible']) ? (bool) $widget['visible'] : true;
        if ($visible) $widgetOrder[] = $widget;
    }

    if (empty($widgetOrder)) {
        $widgetOrder = [
            ['type' => 'company_info',   'style' => [], 'visible' => true, 'order' => 1],
            ['type' => 'employee_info',  'style' => [], 'visible' => true, 'order' => 2],
            ['type' => 'earnings_table', 'style' => [], 'visible' => true, 'order' => 3],
            ['type' => 'summary_box',    'style' => [], 'visible' => true, 'order' => 4],
            ['type' => 'payment_info',   'style' => [], 'visible' => true, 'order' => 5],
        ];
    }
@endphp
<!doctype html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <style>

        @page {
            margin-top:    {{ $margins['top'] * 3.78 }}px;
            margin-bottom: {{ $margins['bottom'] * 3.78 }}px;
            margin-left:   {{ $margins['left'] * 3.78 }}px;
            margin-right:  {{ $margins['right'] * 3.78 }}px;
        }
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

    <div style="font-size: 18px; font-weight: bold; text-align: center; margin: 10px 0 8px 0;">FICHE DE PAIE</div>
    <div style="text-align: center; font-size: 12px; margin-bottom: 12px; font-weight: bold;">
        Période : {{ str_pad((string)$payroll->period_month, 2, '0', STR_PAD_LEFT) }}/{{ $payroll->period_year }}
    </div>

    @foreach($widgetOrder as $widget)
        @php
            $type = $widget['type'];
            $s    = isset($widget['style']) && is_array($widget['style']) ? $widget['style'] : [];

            $bg                    = $s['backgroundColor']      ?? '#fafafa';
            $rowBg                 = $s['backgroundColor']      ?? '#f0f0f0';
            $borderWidth           = $s['borderWidth']          ?? '1px';
            $borderColor           = $s['borderColor']          ?? '#999';
            $padding               = $s['padding']              ?? '8px';
            $borderRadius          = $s['borderRadius']         ?? '0px';
            $fontFamily            = $s['fontFamily']           ?? 'Liberation Sans, sans-serif';
            $headerBorderColor     = $s['headerBorderColor']    ?? '#999';
            $headerBackgroundColor = $s['headerBackgroundColor']?? '#e0e0e0';
            $headerFontSize        = $s['headerFontSize']       ?? '10px';
            $headerFontWeight      = $s['headerFontWeight']     ?? 'bold';
            $bodyBorderColor       = $s['bodyBorderColor']      ?? '#999';
            $bodyFontSize          = $s['bodyFontSize']         ?? '10px';
            $boxFontSize           = $s['fontSize']             ?? '11px';
            $boxFontWeight         = $s['fontWeight']           ?? 'bold';
            $marginTop             = $s['marginTop']            ?? '18px';
        @endphp

        @if($type === 'company_info')
            <div style="background-color:{{ $bg }};border:{{ $borderWidth }} solid {{ $borderColor }};padding:{{ $padding }};border-radius:{{ $borderRadius }};font-family:{{ $fontFamily }};margin-bottom:10px;">
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

        @elseif($type === 'employee_info')
            <div style="background-color:{{ $bg }};border:{{ $borderWidth }} solid {{ $borderColor }};padding:{{ $padding }};border-radius:{{ $borderRadius }};font-family:{{ $fontFamily }};margin-bottom:10px;">
                <div class="box-title">EMPLOYÉ</div>
                <div class="box-item"><span class="label">Nom:</span> {{ addslashes($employee->last_name ?? 'N/A') }}</div>
                <div class="box-item"><span class="label">Prénom:</span> {{ addslashes($employee->first_name ?? 'N/A') }}</div>
                <div class="box-item"><span class="label">Poste:</span> {{ addslashes($employee->position ?? 'N/A') }}</div>
                <div class="box-item"><span class="label">Matricule:</span> EMP-{{ str_pad((string)$employee->id, 5, '0', STR_PAD_LEFT) }}</div>
                <div class="box-item"><span class="label">Embauche:</span> {{ $employee->hire_date ? $employee->hire_date->format('d/m/Y') : 'N/A' }}</div>
            </div>

        @elseif($type === 'earnings_table')
            <table style="margin-bottom:10px;">
                <thead>
                    <tr>
                        <th style="width:6%;  border:1px solid {{ $headerBorderColor }};background-color:{{ $headerBackgroundColor }};font-size:{{ $headerFontSize }};font-weight:{{ $headerFontWeight }};">N</th>
                        <th style="width:32%; border:1px solid {{ $headerBorderColor }};background-color:{{ $headerBackgroundColor }};font-size:{{ $headerFontSize }};font-weight:{{ $headerFontWeight }};">Désignation</th>
                        <th style="width:14%; border:1px solid {{ $headerBorderColor }};background-color:{{ $headerBackgroundColor }};font-size:{{ $headerFontSize }};font-weight:{{ $headerFontWeight }};">Base</th>
                        <th style="width:12%; border:1px solid {{ $headerBorderColor }};background-color:{{ $headerBackgroundColor }};font-size:{{ $headerFontSize }};font-weight:{{ $headerFontWeight }};">Taux</th>
                        <th style="width:18%; border:1px solid {{ $headerBorderColor }};background-color:{{ $headerBackgroundColor }};font-size:{{ $headerFontSize }};font-weight:{{ $headerFontWeight }};">Gain (Ar)</th>
                        <th style="width:18%; border:1px solid {{ $headerBorderColor }};background-color:{{ $headerBackgroundColor }};font-size:{{ $headerFontSize }};font-weight:{{ $headerFontWeight }};">Retenu (Ar)</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($lines as $line)
                        <tr>
                            <td class="center" style="border:1px solid {{ $bodyBorderColor }};font-size:{{ $bodyFontSize }};">{{ $line['numero'] }}</td>
                            <td class="left"   style="border:1px solid {{ $bodyBorderColor }};font-size:{{ $bodyFontSize }};">{{ addslashes($line['designation'] ?? '') }}</td>
                            <td class="right"  style="border:1px solid {{ $bodyBorderColor }};font-size:{{ $bodyFontSize }};">{{ number_format((float)$line['base'], 0, '.', ' ') }}</td>
                            <td class="center" style="border:1px solid {{ $bodyBorderColor }};font-size:{{ $bodyFontSize }};">{{ addslashes($line['taux'] ?? '-') }}</td>
                            <td class="right"  style="border:1px solid {{ $bodyBorderColor }};font-size:{{ $bodyFontSize }};">{{ number_format((float)$line['gain'], 0, '.', ' ') }}</td>
                            <td class="right"  style="border:1px solid {{ $bodyBorderColor }};font-size:{{ $bodyFontSize }};">{{ number_format((float)$line['retenu'], 0, '.', ' ') }}</td>
                        </tr>
                    @endforeach
                    <tr style="background-color:{{ $rowBg }};font-weight:bold;">
                        <td colspan="4" class="right" style="border:1px solid {{ $bodyBorderColor }};">Salaire Brut</td>
                        <td class="right" style="border:1px solid {{ $bodyBorderColor }};">{{ number_format((float)$payroll->gross_salary, 0, '.', ' ') }}</td>
                        <td class="right" style="border:1px solid {{ $bodyBorderColor }};">-</td>
                    </tr>
                    <tr style="background-color:{{ $rowBg }};font-weight:bold;">
                        <td colspan="4" class="right" style="border:1px solid {{ $bodyBorderColor }};">Total Retenu</td>
                        <td class="right" style="border:1px solid {{ $bodyBorderColor }};">-</td>
                        <td class="right" style="border:1px solid {{ $bodyBorderColor }};">{{ number_format((float)$payroll->total_retenu, 0, '.', ' ') }}</td>
                    </tr>
                    <tr style="background-color:{{ $rowBg }};font-weight:bold;font-size:12px;">
                        <td colspan="4" class="right" style="border:1px solid {{ $bodyBorderColor }};">NET À PAYER</td>
                        <td colspan="2" class="right" style="border:1px solid {{ $bodyBorderColor }};">{{ number_format((float)$payroll->net_to_pay, 0, '.', ' ') }}</td>
                    </tr>
                </tbody>
            </table>

        @elseif($type === 'summary_box')
            <div style="background-color:{{ $rowBg }};padding:{{ $padding }};margin-bottom:10px;">
                <table style="width:100%;font-size:{{ $boxFontSize }};font-weight:{{ $boxFontWeight }};">
                    <tr>
                        <td>Salaire Brut :</td>
                        <td style="text-align:right;">{{ number_format((float)$payroll->gross_salary, 0, '.', ' ') }} Ar</td>
                    </tr>
                    <tr>
                        <td>Total Retenu :</td>
                        <td style="text-align:right;">{{ number_format((float)$payroll->total_retenu, 0, '.', ' ') }} Ar</td>
                    </tr>
                    <tr style="font-size:13px;font-weight:bold;">
                        <td>NET À PAYER :</td>
                        <td style="text-align:right;">{{ number_format((float)$payroll->net_to_pay, 0, '.', ' ') }} Ar</td>
                    </tr>
                </table>
            </div>

        @elseif($type === 'payment_info')
            <div style="background-color:{{ $bg }};border:{{ $borderWidth }} solid {{ $borderColor }};padding:{{ $padding }};margin-top:{{ $marginTop }};">
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
