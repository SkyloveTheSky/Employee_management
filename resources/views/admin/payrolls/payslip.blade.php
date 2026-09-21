<!doctype html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>Fiche de paie{{ !empty($settings?->company_name) ? ' · '.$settings->company_name : '' }}</title>
    <style>
        @page { margin: 18mm 16mm; }
        body { font-family: Liberation Sans, DejaVu Sans, sans-serif; font-size: 11px; color: #1a1a1a; line-height: 1.4; }
        .title { font-size: 18px; font-weight: bold; text-align: center; margin: 0 0 4px 0; }
        .period { text-align: center; font-size: 12px; font-weight: bold; margin-bottom: 14px; }
        .row { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        .row td { vertical-align: top; width: 50%; }
        .box { background-color: #fafafa; border: 1px solid #999; padding: 8px; }
        .box-right { margin-left: 8px; }
        .box-title { font-size: 12px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin-bottom: 4px; }
        .box-item { margin: 2px 0; font-size: 10px; }
        .label { font-weight: bold; }
        .header-logo { text-align: center; margin-bottom: 10px; }
        .header-logo img { max-height: 56px; max-width: 180px; }
        table.lines { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
        table.lines th { border: 1px solid #999; background-color: #e0e0e0; font-size: 10px; font-weight: bold; padding: 5px 4px; }
        table.lines td { border: 1px solid #999; font-size: 10px; padding: 4px; }
        .right { text-align: right; padding-right: 6px; }
        .center { text-align: center; }
        .left { text-align: left; }
        .totals { background-color: #f0f0f0; font-weight: bold; }
        .net { font-size: 12px; }
        .payment { background-color: #fafafa; border: 1px solid #999; padding: 8px; margin-top: 4px; }
    </style>
</head>
<body>
    @if(!empty($logoDataUri))
        <div class="header-logo">
            <img src="{{ $logoDataUri }}" alt="Logo">
        </div>
    @endif
    <div class="title">FICHE DE PAIE</div>
    <div class="period">
        Période : {{ str_pad((string) $payroll->period_month, 2, '0', STR_PAD_LEFT) }}/{{ $payroll->period_year }}
    </div>

    <table class="row">
        <tr>
            <td>
                <div class="box">
                    <div class="box-title">ENTREPRISE</div>
                    <div class="box-item"><span class="label">Nom :</span> {{ $settings->company_name ?? 'N/A' }}</div>
                    <div class="box-item"><span class="label">Propriétaire :</span> {{ $settings->owner_name ?? 'N/A' }}</div>
                    <div class="box-item"><span class="label">NIF :</span> {{ $settings->nif ?? 'N/A' }}</div>
                    <div class="box-item"><span class="label">STAT :</span> {{ $settings->stat ?? 'N/A' }}</div>
                    <div class="box-item"><span class="label">RCS :</span> {{ $settings->rcs ?? 'N/A' }}</div>
                </div>
            </td>
            <td>
                <div class="box box-right">
                    <div class="box-title">EMPLOYÉ</div>
                    <div class="box-item"><span class="label">Nom :</span> {{ $employee->last_name ?? 'N/A' }}</div>
                    <div class="box-item"><span class="label">Prénom :</span> {{ $employee->first_name ?? 'N/A' }}</div>
                    <div class="box-item"><span class="label">Poste :</span> {{ $employee->position ?? 'N/A' }}</div>
                    <div class="box-item"><span class="label">Matricule :</span> EMP-{{ str_pad((string) $employee->id, 5, '0', STR_PAD_LEFT) }}</div>
                    <div class="box-item"><span class="label">Embauche :</span> {{ $employee->hire_date ? $employee->hire_date->format('d/m/Y') : 'N/A' }}</div>
                </div>
            </td>
        </tr>
    </table>

    <table class="lines">
        <thead>
            <tr>
                <th style="width:6%;">N</th>
                <th style="width:32%;">Désignation</th>
                <th style="width:14%;">Base</th>
                <th style="width:12%;">Taux</th>
                <th style="width:18%;">Gain (Ar)</th>
                <th style="width:18%;">Retenu (Ar)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($lines as $line)
                <tr>
                    <td class="center">{{ $line['numero'] }}</td>
                    <td class="left">{{ $line['designation'] ?? '' }}</td>
                    <td class="right">{{ number_format((float) $line['base'], 0, '.', ' ') }}</td>
                    <td class="center">{{ $line['taux'] ?? '-' }}</td>
                    <td class="right">{{ number_format((float) $line['gain'], 0, '.', ' ') }}</td>
                    <td class="right">{{ number_format((float) $line['retenu'], 0, '.', ' ') }}</td>
                </tr>
            @endforeach
            <tr class="totals">
                <td colspan="4" class="right">Salaire brut</td>
                <td class="right">{{ number_format((float) $payroll->gross_salary, 0, '.', ' ') }}</td>
                <td class="right">-</td>
            </tr>
            <tr class="totals">
                <td colspan="4" class="right">Total retenu</td>
                <td class="right">-</td>
                <td class="right">{{ number_format((float) $payroll->total_retenu, 0, '.', ' ') }}</td>
            </tr>
            <tr class="totals net">
                <td colspan="4" class="right">NET À PAYER</td>
                <td colspan="2" class="right">{{ number_format((float) $payroll->net_to_pay, 0, '.', ' ') }}</td>
            </tr>
        </tbody>
    </table>

    <div class="payment" style="margin-bottom: 12px;">
        <div class="box-title">CONGÉS DU MOIS</div>
        @foreach($leaves as $leave)
            <div class="box-item">
                <span class="label">{{ $leave['type_label'] }}:</span>
                {{ rtrim(rtrim(number_format((float) ($leave['days'] ?? 0), 1, ',', ' '), '0'), ',') }}
            </div>
        @endforeach
    </div>

    <div class="payment">
        <div class="box-title">INFORMATIONS DE PAIEMENT</div>
        <div class="box-item"><span class="label">Mode :</span> {{ $payroll->payment_method ?? 'N/A' }}</div>
        <div class="box-item"><span class="label">Statut :</span> {{ $payroll->payment_status === 'paid' ? 'PAYÉ' : 'NON PAYÉ' }}</div>
        <div class="box-item"><span class="label">Date paiement :</span> {{ $payroll->paid_at ? $payroll->paid_at->format('d/m/Y') : 'N/A' }}</div>
        @if($payroll->notes)
            <div class="box-item"><span class="label">Notes :</span> {{ $payroll->notes }}</div>
        @endif
    </div>
</body>
</html>
