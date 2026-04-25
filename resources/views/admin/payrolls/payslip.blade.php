<!doctype html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <style>
        * { margin: 0; padding: 0; }
        @page { margin: 20px 20px; }
        body {
            font-family: Liberation Sans, DejaVu Sans, sans-serif;
            font-size: 11px;
            color: #1a1a1a;
            line-height: 1.4;
        }
        .container { width: 100%; }
        .row { width: 100%; page-break-inside: avoid; }
        .col { display: inline-block; vertical-align: top; }

        /* Boite Entreprise */
        .company-box {
            background-color: {{ $styles['company_box']['backgroundColor'] ?? '#fafafa' }};
            border: {{ $styles['company_box']['borderWidth'] ?? '1px' }} solid {{ $styles['company_box']['borderColor'] ?? '#999' }};
            padding: {{ $styles['company_box']['padding'] ?? '8px' }};
            border-radius: {{ $styles['company_box']['borderRadius'] ?? '0px' }};
            font-family: {{ $styles['company_box']['fontFamily'] ?? 'Liberation Sans, sans-serif' }};
            margin-bottom: 10px;
        }

        /* Boite Employe */
        .employee-box {
            background-color: {{ $styles['employee_box']['backgroundColor'] ?? '#fafafa' }};
            border: {{ $styles['employee_box']['borderWidth'] ?? '1px' }} solid {{ $styles['employee_box']['borderColor'] ?? '#999' }};
            padding: {{ $styles['employee_box']['padding'] ?? '8px' }};
            border-radius: {{ $styles['employee_box']['borderRadius'] ?? '0px' }};
            font-family: {{ $styles['employee_box']['fontFamily'] ?? 'Liberation Sans, sans-serif' }};
            margin-bottom: 10px;
        }

        /* Titre principal */
        .title {
            font-size: {{ $styles['title_text']['fontSize'] ?? '18px' }};
            font-weight: {{ $styles['title_text']['fontWeight'] ?? 'bold' }};
            color: {{ $styles['title_text']['color'] ?? '#1a1a1a' }};
            text-align: {{ $styles['title_text']['textAlign'] ?? 'center' }};
            margin: 10px 0 8px 0;
        }

        /* Titre des boites */
        .box-title {
            font-size: {{ $styles['box_title']['fontSize'] ?? '12px' }};
            font-weight: {{ $styles['box_title']['fontWeight'] ?? 'bold' }};
            color: {{ $styles['box_title']['color'] ?? '#1a1a1a' }};
            border-bottom: {{ $styles['box_title']['borderBottomWidth'] ?? '1px' }} solid {{ $styles['box_title']['borderBottomColor'] ?? '#ccc' }};
            padding-bottom: {{ $styles['box_title']['paddingBottom'] ?? '3px' }};
            margin-bottom: 4px;
        }

        .box-item { margin: 2px 0; font-size: 10px; }
        .label { font-weight: bold; }
        .muted { color: #666; }
        .subtitle { font-size: 11px; margin: 0; text-align: center; }
        .mt-8 { margin-top: 8px; }
        .mt-12 { margin-top: 12px; }
        .mt-18 { margin-top: 18px; }
        .hr { height: 1px; background: #ccc; margin: 8px 0; }

        /* Tableau */
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th {
            border: 1px solid {{ $styles['table_header']['borderColor'] ?? '#999' }};
            padding: 6px 4px;
            background-color: {{ $styles['table_header']['backgroundColor'] ?? '#e0e0e0' }};
            text-align: center;
            font-weight: {{ $styles['table_header']['fontWeight'] ?? 'bold' }};
            font-size: {{ $styles['table_header']['fontSize'] ?? '10px' }};
            color: {{ $styles['table_header']['color'] ?? '#1a1a1a' }};
        }
        td {
            border: 1px solid {{ $styles['table_body']['borderColor'] ?? '#999' }};
            padding: 6px 4px;
            font-size: {{ $styles['table_body']['fontSize'] ?? '10px' }};
            color: {{ $styles['table_body']['color'] ?? '#1a1a1a' }};
        }

        .right { text-align: right; padding-right: 6px; }
        .center { text-align: center; }
        .left { text-align: left; }

        .totals td {
            font-weight: {{ $styles['table_totals']['fontWeight'] ?? 'bold' }};
            background-color: {{ $styles['table_totals']['backgroundColor'] ?? '#f0f0f0' }};
            font-size: {{ $styles['table_totals']['fontSize'] ?? '10px' }};
            color: {{ $styles['table_totals']['color'] ?? '#1a1a1a' }};
        }

        .logo { max-height: 40px; max-width: 100px; margin-bottom: 4px; }
        .header-section { margin-bottom: 12px; }
        .payment-info { font-size: 10px; }

        /* Boite paiement */
        .payment-box {
            background-color: {{ $styles['payment_info_box']['backgroundColor'] ?? '#fafafa' }};
            border: {{ $styles['payment_info_box']['borderWidth'] ?? '1px' }} solid {{ $styles['payment_info_box']['borderColor'] ?? '#999' }};
            padding: {{ $styles['payment_info_box']['padding'] ?? '8px' }};
            margin-top: {{ $styles['payment_info_box']['marginTop'] ?? '18px' }};
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- En-tete -->
        <div class="title">FICHE DE PAIE</div>

        <!-- Informations entreprise et employe -->
        <div class="row">
            <div class="col" style="width: 48%;">
                <div class="company-box">
                    <div class="box-title">ENTREPRISE</div>
                    @if($logoDataUri)
                        <img class="logo" src="{{ $logoDataUri }}" alt="Logo">
                    @endif
                    <div class="box-item"><span class="label">Nom:</span> {{ addslashes($settings->company_name ?? 'N/A') }}</div>
                    <div class="box-item"><span class="label">Proprietaire:</span> {{ addslashes($settings->owner_name ?? 'N/A') }}</div>
                    <div class="box-item"><span class="label">NIF:</span> {{ addslashes($settings->nif ?? 'N/A') }}</div>
                    <div class="box-item"><span class="label">STAT:</span> {{ addslashes($settings->stat ?? 'N/A') }}</div>
                    <div class="box-item"><span class="label">RCS:</span> {{ addslashes($settings->rcs ?? 'N/A') }}</div>
                </div>
            </div>

            <div class="col" style="width: 48%; margin-left: 4%;">
                <div class="employee-box">
                    <div class="box-title">EMPLOYE</div>
                    <div class="box-item"><span class="label">Nom:</span> {{ addslashes($employee->last_name ?? 'N/A') }}</div>
                    <div class="box-item"><span class="label">Prenom:</span> {{ addslashes($employee->first_name ?? 'N/A') }}</div>
                    <div class="box-item"><span class="label">Poste:</span> {{ addslashes($employee->position ?? 'N/A') }}</div>
                    <div class="box-item"><span class="label">Matricule:</span> EMP-{{ str_pad((string)$employee->id, 5, '0', STR_PAD_LEFT) }}</div>
                    <div class="box-item"><span class="label">Embauche:</span> {{ $employee->hire_date ? $employee->hire_date->format('d/m/Y') : 'N/A' }}</div>
                </div>
            </div>
        </div>

        <!-- Periode de paie -->
        <div class="row mt-12">
            <div class="box" style="width: 100%;">
                <div style="font-weight: bold; font-size: 12px;">
                    Periode: {{ str_pad((string)$payroll->period_month, 2, '0', STR_PAD_LEFT) }}/{{ $payroll->period_year }}
                </div>
            </div>
        </div>

        <!-- Tableau de paie -->
        <div class="row mt-12">
            <table>
                <thead>
                    <tr>
                        <th style="width: 6%;">N</th>
                        <th style="width: 32%;">Designation</th>
                        <th style="width: 14%;">Base</th>
                        <th style="width: 12%;">Taux</th>
                        <th style="width: 18%;">Gain (Ar)</th>
                        <th style="width: 18%;">Retenu (Ar)</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($lines as $line)
                        <tr>
                            <td class="center">{{ $line['numero'] }}</td>
                            <td class="left">{{ addslashes($line['designation'] ?? '') }}</td>
                            <td class="right">{{ number_format((float)$line['base'], 0, '.', ' ') }}</td>
                            <td class="center">{{ addslashes($line['taux'] ?? '-') }}</td>
                            <td class="right">{{ number_format((float)$line['gain'], 0, '.', ' ') }}</td>
                            <td class="right">{{ number_format((float)$line['retenu'], 0, '.', ' ') }}</td>
                        </tr>
                    @endforeach

                    <tr class="totals">
                        <td colspan="4" class="right"><span class="label">Salaire Brut</span></td>
                        <td class="right">{{ number_format((float)$payroll->gross_salary, 0, '.', ' ') }}</td>
                        <td class="right">-</td>
                    </tr>
                    <tr class="totals">
                        <td colspan="4" class="right"><span class="label">Total Retenu</span></td>
                        <td class="right">-</td>
                        <td class="right">{{ number_format((float)$payroll->total_retenu, 0, '.', ' ') }}</td>
                    </tr>
                    <tr class="totals" style="font-size: 12px; font-weight: bold;">
                        <td colspan="4" class="right"><span class="label">NET A PAYER</span></td>
                        <td class="right" colspan="2">{{ number_format((float)$payroll->net_to_pay, 0, '.', ' ') }}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Informations paiement -->
        <div class="payment-box">
            <div class="box-title">INFORMATIONS DE PAIEMENT</div>
            <div class="payment-info">
                <div class="box-item"><span class="label">Mode:</span> {{ addslashes($payroll->payment_method ?? 'N/A') }}</div>
                <div class="box-item"><span class="label">Statut:</span> {{ $payroll->payment_status === 'paid' ? 'PAYE' : 'NON PAYE' }}</div>
                <div class="box-item"><span class="label">Date paiement:</span> {{ $payroll->paid_at ? $payroll->paid_at->format('d/m/Y') : 'N/A' }}</div>
                @if($payroll->notes)
                    <div class="box-item"><span class="label">Notes:</span> {{ addslashes($payroll->notes) }}</div>
                @endif
            </div>
        </div>
    </div>
</body>
</html>

