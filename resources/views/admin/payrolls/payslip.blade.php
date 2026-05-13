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
            ['type' => 'entreprise',    'style' => [], 'visible' => true],
            ['type' => 'employeeBlock', 'style' => [], 'visible' => true],
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

    <div style="font-size:18px;font-weight:bold;text-align:center;margin:10px 0 8px 0;">FICHE DE PAIE</div>
    <div style="text-align:center;font-size:12px;margin-bottom:12px;font-weight:bold;">
        Période : {{ str_pad((string)$payroll->period_month, 2, '0', STR_PAD_LEFT) }}/{{ $payroll->period_year }}
    </div>

    {{-- ── WIDGETS PERSONNALISABLES (entreprise, employeeBlock, container, spacer) ── --}}
    @foreach($widgetOrder as $widget)
        @php
            $type = $widget['type'];
            $s    = isset($widget['style']) && is_array($widget['style']) ? $widget['style'] : [];
            $bg          = $s['backgroundColor'] ?? '#fafafa';
            $borderWidth = $s['borderWidth']     ?? '1px';
            $borderColor = $s['borderColor']     ?? '#999';
            $padding     = $s['padding']         ?? '8px';
            $borderRadius= $s['borderRadius']    ?? '0px';
            $fontFamily  = $s['fontFamily']      ?? 'Liberation Sans, sans-serif';
        @endphp

        @if($type === 'entreprise')
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

        @elseif($type === 'employeeBlock')
            <div style="background-color:{{ $bg }};border:{{ $borderWidth }} solid {{ $borderColor }};padding:{{ $padding }};border-radius:{{ $borderRadius }};font-family:{{ $fontFamily }};margin-bottom:10px;">
                <div class="box-title">EMPLOYÉ</div>
                <div class="box-item"><span class="label">Nom:</span> {{ addslashes($employee->last_name ?? 'N/A') }}</div>
                <div class="box-item"><span class="label">Prénom:</span> {{ addslashes($employee->first_name ?? 'N/A') }}</div>
                <div class="box-item"><span class="label">Poste:</span> {{ addslashes($employee->position ?? 'N/A') }}</div>
                <div class="box-item"><span class="label">Matricule:</span> EMP-{{ str_pad((string)$employee->id, 5, '0', STR_PAD_LEFT) }}</div>
                <div class="box-item"><span class="label">Embauche:</span> {{ $employee->hire_date ? $employee->hire_date->format('d/m/Y') : 'N/A' }}</div>
            </div>

        @elseif($type === 'spacer')
            <div style="height:{{ $s['height'] ?? '10px' }};"></div>

        @elseif($type === 'container')
            <div style="background-color:{{ $bg }};border:{{ $borderWidth }} solid {{ $borderColor }};padding:{{ $padding }};border-radius:{{ $borderRadius }};margin-bottom:10px;">
            </div>
        @endif
    @endforeach

    {{-- ── TABLEAU DE PAIE (fixe, non personnalisable) ── --}}
    <table style="margin-bottom:10px;">
        <thead>
            <tr>
                <th style="width:6%;  border:1px solid #999;background-color:#e0e0e0;font-size:10px;font-weight:bold;">N</th>
                <th style="width:32%; border:1px solid #999;background-color:#e0e0e0;font-size:10px;font-weight:bold;">Désignation</th>
                <th style="width:14%; border:1px solid #999;background-color:#e0e0e0;font-size:10px;font-weight:bold;">Base</th>
                <th style="width:12%; border:1px solid #999;background-color:#e0e0e0;font-size:10px;font-weight:bold;">Taux</th>
                <th style="width:18%; border:1px solid #999;background-color:#e0e0e0;font-size:10px;font-weight:bold;">Gain (Ar)</th>
                <th style="width:18%; border:1px solid #999;background-color:#e0e0e0;font-size:10px;font-weight:bold;">Retenu (Ar)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($lines as $line)
                <tr>
                    <td class="center" style="border:1px solid #999;font-size:10px;">{{ $line['numero'] }}</td>
                    <td class="left"   style="border:1px solid #999;font-size:10px;">{{ addslashes($line['designation'] ?? '') }}</td>
                    <td class="right"  style="border:1px solid #999;font-size:10px;">{{ number_format((float)$line['base'], 0, '.', ' ') }}</td>
                    <td class="center" style="border:1px solid #999;font-size:10px;">{{ addslashes($line['taux'] ?? '-') }}</td>
                    <td class="right"  style="border:1px solid #999;font-size:10px;">{{ number_format((float)$line['gain'], 0, '.', ' ') }}</td>
                    <td class="right"  style="border:1px solid #999;font-size:10px;">{{ number_format((float)$line['retenu'], 0, '.', ' ') }}</td>
                </tr>
            @endforeach
            <tr style="background-color:#f0f0f0;font-weight:bold;">
                <td colspan="4" class="right" style="border:1px solid #999;">Salaire Brut</td>
                <td class="right" style="border:1px solid #999;">{{ number_format((float)$payroll->gross_salary, 0, '.', ' ') }}</td>
                <td class="right" style="border:1px solid #999;">-</td>
            </tr>
            <tr style="background-color:#f0f0f0;font-weight:bold;">
                <td colspan="4" class="right" style="border:1px solid #999;">Total Retenu</td>
                <td class="right" style="border:1px solid #999;">-</td>
                <td class="right" style="border:1px solid #999;">{{ number_format((float)$payroll->total_retenu, 0, '.', ' ') }}</td>
            </tr>
            <tr style="background-color:#f0f0f0;font-weight:bold;font-size:12px;">
                <td colspan="4" class="right" style="border:1px solid #999;">NET À PAYER</td>
                <td colspan="2" class="right" style="border:1px solid #999;">{{ number_format((float)$payroll->net_to_pay, 0, '.', ' ') }}</td>
            </tr>
        </tbody>
    </table>

    {{-- ── PAIEMENT (fixe) ── --}}
    <div style="background-color:#fafafa;border:1px solid #999;padding:8px;margin-top:18px;">
        <div class="box-title">INFORMATIONS DE PAIEMENT</div>
        <div class="box-item"><span class="label">Mode :</span> {{ addslashes($payroll->payment_method ?? 'N/A') }}</div>
        <div class="box-item"><span class="label">Statut :</span> {{ $payroll->payment_status === 'paid' ? 'PAYÉ' : 'NON PAYÉ' }}</div>
        <div class="box-item"><span class="label">Date paiement :</span> {{ $payroll->paid_at ? $payroll->paid_at->format('d/m/Y') : 'N/A' }}</div>
        @if($payroll->notes)
            <div class="box-item"><span class="label">Notes :</span> {{ addslashes($payroll->notes) }}</div>
        @endif
    </div>

</div>
</body>
</html>
