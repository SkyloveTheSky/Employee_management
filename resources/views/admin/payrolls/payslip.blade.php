<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 22px 26px; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #111827; }
        .row { width: 100%; }
        .col { display: inline-block; vertical-align: top; }
        .box { border: 1px solid #111827; padding: 10px; border-radius: 4px; }
        .muted { color: #6b7280; }
        .title { font-size: 16px; font-weight: 700; margin: 0 0 6px; }
        .subtitle { font-size: 12px; margin: 0; }
        .mt-12 { margin-top: 12px; }
        .mt-18 { margin-top: 18px; }
        .mt-24 { margin-top: 24px; }
        .hr { height: 1px; background: #e5e7eb; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #111827; padding: 8px; }
        th { background: #f3f4f6; text-align: left; }
        .right { text-align: right; }
        .center { text-align: center; }
        .totals td { font-weight: 700; }
        .logo { max-height: 44px; max-width: 120px; margin-bottom: 6px; }
    </style>
</head>
<body>
    <div class="row">
        <div class="col" style="width: 49%;">
            <div class="box">
                @if($logoDataUri)
                    <img class="logo" src="{{ $logoDataUri }}" alt="Logo">
                @endif
                <div style="font-weight:700;">{{ $settings->company_name ?? 'Entreprise' }}</div>
                <div class="muted">Propriétaire: {{ $settings->owner_name ?? '-' }}</div>
                <div class="muted">NIF: {{ $settings->nif ?? '-' }}</div>
                <div class="muted">STAT: {{ $settings->stat ?? '-' }}</div>
                <div class="muted">RCS: {{ $settings->rcs ?? '-' }}</div>
            </div>
        </div>

        <div class="col" style="width: 49%; margin-left: 2%;">
            <div class="box">
                <div style="font-weight:700;">Employé</div>
                <div>Nom: {{ $employee->last_name ?? '-' }}</div>
                <div>Prénom: {{ $employee->first_name ?? '-' }}</div>
                <div>Matricule: {{ 'EMP-' . str_pad((string)$employee->id, 5, '0', STR_PAD_LEFT) }}</div>
                <div>Date d'embauche: {{ $employee->hire_date?->translatedFormat('d F Y') ?? '-' }}</div>
            </div>
        </div>
    </div>

    <div class="mt-12">
        <div class="title">Fiche de paie: {{ str_pad((string)$payroll->period_month, 2, '0', STR_PAD_LEFT) }}/{{ $payroll->period_year }}</div>
    </div>

    <div class="mt-12">
        <table>
            <thead>
                <tr>
                    <th style="width: 7%;">N°</th>
                    <th style="width: 33%;">Désignation</th>
                    <th style="width: 15%;">Base</th>
                    <th style="width: 12%;">Taux</th>
                    <th style="width: 16%;">Gain (Ar)</th>
                    <th style="width: 17%;">Retenu (Ar)</th>
                </tr>
            </thead>
            <tbody>
                @foreach($lines as $line)
                    <tr>
                        <td class="center">{{ $line['numero'] }}</td>
                        <td>{{ $line['designation'] }}</td>
                        <td class="right">{{ number_format((float)$line['base'], 0, ',', ' ') }}</td>
                        <td class="center">{{ $line['taux'] ?? '-' }}</td>
                        <td class="right">{{ number_format((float)$line['gain'], 0, ',', ' ') }}</td>
                        <td class="right">{{ number_format((float)$line['retenu'], 0, ',', ' ') }}</td>
                    </tr>
                @endforeach

                <tr class="totals">
                    <td colspan="4" class="right">Salaire brut</td>
                    <td class="right">{{ number_format((float)$payroll->gross_salary, 0, ',', ' ') }}</td>
                    <td class="right">-</td>
                </tr>
                <tr class="totals">
                    <td colspan="4" class="right">Total retenu</td>
                    <td class="right">-</td>
                    <td class="right">{{ number_format((float)$payroll->total_retenu, 0, ',', ' ') }}</td>
                </tr>
                <tr class="totals">
                    <td colspan="4" class="right">Net à payer</td>
                    <td class="right" colspan="2">{{ number_format((float)$payroll->net_to_pay, 0, ',', ' ') }}</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="mt-18">
        <div class="box">
            <div><strong>Mode de paiement:</strong> {{ $payroll->payment_method }}</div>
            <div><strong>Statut:</strong> {{ $payroll->payment_status === 'paid' ? 'Payé' : 'Non payé' }}</div>
            <div><strong>Date de paiement:</strong> {{ $payroll->paid_at?->translatedFormat('d F Y') ?? '-' }}</div>
        </div>
    </div>
</body>
</html>

