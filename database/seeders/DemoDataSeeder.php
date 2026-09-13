<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\AgendaNote;
use App\Models\CompanySetting;
use App\Models\InboxMessage;
use App\Models\Payroll;
use App\Models\PlatformNotification;
use App\Models\User;
use App\Services\Payroll\PayrollCalculator;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $admin = Admin::query()->first();
        if (! $admin) {
            $this->command?->warn('Aucun admin trouvé. Lancez d’abord AdminSeeder.');

            return;
        }

        $this->seedCompany();
        $employees = $this->seedEmployees();
        $this->seedPayrolls($employees, $admin->id);
        $this->seedAgendaNotes($admin->id);
        $this->seedInbox($employees, $admin->id);

        $this->command?->info('Données de démonstration enrichies (employés, paies, notes d’agenda, messages).');
        $this->command?->info('Connexion employé démo : andry.rakoto@demo.mg / password');
    }

    private function seedCompany(): void
    {
        $settings = CompanySetting::query()->first();
        if (! $settings) {
            CompanySetting::query()->create([
                'company_name' => 'Cathicia\'s group',
                'owner_name' => 'Cathicia Rasoanaivo',
                'nif' => '4001234567',
                'stat' => '32101 11 2020 0 12345',
                'rcs' => '2020 B 00123',
            ]);

            return;
        }

        $settings->fill(array_filter([
            'owner_name' => $settings->owner_name ?: 'Cathicia Rasoanaivo',
            'nif' => $settings->nif ?: '4001234567',
            'stat' => $settings->stat ?: '32101 11 2020 0 12345',
            'rcs' => $settings->rcs ?: '2020 B 00123',
        ], fn ($value) => $value !== null && $value !== ''));
        $settings->save();
    }

    /**
     * @return list<array{user: User, profile: string}>
     */
    private function seedEmployees(): array
    {
        $rows = [
            ['Andry', 'Rakoto', 'andry.rakoto@demo.mg', '034 12 345 01', 'Responsable RH', '2022-03-15', 1800000, 'regular', '2022-03-15'],
            ['Mialy', 'Andriamanana', 'mialy.andriamanana@demo.mg', '034 12 345 02', 'Comptable', '2023-01-09', 1500000, 'regular', '2023-01-09'],
            ['Tojo', 'Randria', 'tojo.randria@demo.mg', '034 12 345 03', 'Développeur', '2024-06-01', 2200000, 'bonus', '2024-06-01'],
            ['Fara', 'Rasoa', 'fara.rasoa@demo.mg', '034 12 345 04', 'Assistante administrative', '2021-11-20', 900000, 'regular', '2021-11-20'],
            ['Hery', 'Rakotomalala', 'hery.rakotomalala@demo.mg', '034 12 345 05', 'Commercial', '2023-09-12', 1200000, 'late', '2023-09-12'],
            ['Voahirana', 'Rabe', 'voahirana.rabe@demo.mg', '034 12 345 06', 'Chef de projet', '2020-02-03', 2500000, 'bonus', '2020-02-03'],
            ['Lova', 'Rajaonarivelo', 'lova.rajaonarivelo@demo.mg', '034 12 345 07', 'Technicien', '2025-05-18', 800000, 'gap', '2025-05-18'],
            ['Nomena', 'Andrianina', 'nomena.andrianina@demo.mg', '034 12 345 08', 'Chargée de paie', '2024-09-08', 1300000, 'regular', '2024-09-08'],
            ['Tiana', 'Razafy', 'tiana.razafy@demo.mg', '034 12 345 09', 'Stagiaire', '2026-09-02', 400000, 'intern', '2026-09-02'],
            ['Soa', 'Ramanantsoa', 'soa.ramanantsoa@demo.mg', '034 12 345 10', 'Responsable logistique', '2022-09-25', 1600000, 'regular', '2022-09-25'],
            ['Hasina', 'Randrianarisoa', 'hasina.randrianarisoa@demo.mg', '032 11 220 11', 'Juriste', '2021-04-12', 1700000, 'regular', '2021-04-12'],
            ['Tahina', 'Ravelojaona', 'tahina.ravelojaona@demo.mg', '032 11 220 12', 'Analyste financier', '2023-07-03', 1900000, 'bonus', '2023-07-03'],
            ['Malala', 'Andriamampianina', 'malala.andriamampianina@demo.mg', '033 44 880 13', 'Graphiste', '2024-02-19', 1100000, 'late', '2024-02-19'],
            ['Njaka', 'Ratsimbazafy', 'njaka.ratsimbazafy@demo.mg', '034 55 101 14', 'Chauffeur', '2019-08-01', 700000, 'cash', '2019-08-01'],
            ['Fenosoa', 'Rakotondrasoa', 'fenosoa.rakotondrasoa@demo.mg', '034 55 101 15', 'Magasinier', '2022-12-05', 750000, 'gap', '2022-12-05'],
            ['Aina', 'Razanakolona', 'aina.razanakolona@demo.mg', '038 70 440 16', 'Community manager', '2025-01-13', 950000, 'regular', '2025-01-13'],
            ['Mamy', 'Andriamalala', 'mamy.andriamalala@demo.mg', '038 70 440 17', 'Ingénieur réseau', '2024-11-04', 2100000, 'bonus', '2024-11-04'],
            ['Kanto', 'Rasoamanana', 'kanto.rasoamanana@demo.mg', '034 90 330 18', 'Secrétaire de direction', '2018-06-22', 1000000, 'regular', '2018-06-22'],
            ['Rija', 'Rakotovao', 'rija.rakotovao@demo.mg', '032 18 660 19', 'Agent de sécurité', '2026-01-06', 650000, 'intern', '2026-01-06'],
            ['Volana', 'Andrianjafy', 'volana.andrianjafy@demo.mg', '033 21 770 20', 'Responsable qualité', '2023-03-28', 1750000, 'regular', '2023-03-28'],
            ['Sitraka', 'Raharison', 'sitraka.raharison@demo.mg', '034 12 880 21', 'Développeur frontend', '2026-04-14', 2000000, 'new', '2026-04-14'],
            ['Hanitra', 'Rambeloson', 'hanitra.rambeloson@demo.mg', '032 44 990 22', 'Acheteuse', '2021-09-30', 1250000, 'late', '2021-09-30'],
            ['Toky', 'Andriantsitohaina', 'toky.andriantsitohaina@demo.mg', '038 11 120 23', 'Chef d’atelier', '2017-05-11', 1400000, 'cash', '2017-05-11'],
            ['Niry', 'Rasolofoniaina', 'niry.rasolofoniaina@demo.mg', '034 77 230 24', 'Assistante commerciale', '2025-08-20', 850000, 'new', '2025-08-20'],
            ['Faly', 'Rakotomanga', 'faly.rakotomanga@demo.mg', '033 66 340 25', 'Data analyst', '2026-06-01', 1950000, 'new', '2026-06-01'],
        ];

        $employees = [];
        foreach ($rows as $row) {
            [$first, $last, $email, $phone, $position, $hireDate, $salary, $profile, $createdAt] = $row;
            $user = User::query()->updateOrCreate(
                ['email' => $email],
                [
                    'first_name' => $first,
                    'last_name' => $last,
                    'phone' => $phone,
                    'position' => $position,
                    'hire_date' => $hireDate,
                    'salary_base' => $salary,
                    'password' => 'password',
                    'email_verified_at' => $createdAt,
                ]
            );
            $user->timestamps = false;
            $user->created_at = Carbon::parse($createdAt)->startOfDay();
            $user->updated_at = Carbon::parse($createdAt)->startOfDay();
            $user->save();

            $employees[] = ['user' => $user->fresh(), 'profile' => $profile];
        }

        return $employees;
    }

    /**
     * @param  list<array{user: User, profile: string}>  $employees
     */
    private function seedPayrolls(array $employees, int $adminId): void
    {
        $now = Carbon::now()->startOfMonth();
        $periods = [];
        for ($i = 7; $i >= 0; $i--) {
            $periods[] = $now->copy()->subMonths($i);
        }

        foreach ($employees as $employee) {
            $user = $employee['user'];
            $profile = $employee['profile'];
            $hire = Carbon::parse($user->hire_date)->startOfMonth();

            foreach ($periods as $periodIndex => $period) {
                if ($period->lt($hire)) {
                    continue;
                }
                if ($this->shouldSkipPayroll($profile, $periodIndex, count($periods))) {
                    continue;
                }

                $prime = $this->primeFor($profile, $periodIndex, count($periods));
                $overtime = $this->overtimeFor($profile, $periodIndex);
                $amounts = PayrollCalculator::compute($user, $prime, $overtime, $profile === 'cash' ? 0.5 : 1);
                $isPaid = $this->isPaid($profile, $periodIndex, count($periods));
                $paidAt = $isPaid
                    ? $period->copy()->day($profile === 'late' ? min(18, $period->daysInMonth) : min(5 + ($periodIndex % 4), $period->daysInMonth))->toDateString()
                    : null;

                $method = match ($profile) {
                    'cash' => 'especes',
                    'late' => 'mobile_money',
                    'bonus' => $periodIndex % 2 === 0 ? 'virement' : 'cheque',
                    default => 'virement',
                };

                Payroll::query()->updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'period_month' => (int) $period->month,
                        'period_year' => (int) $period->year,
                    ],
                    [
                        ...$amounts,
                        'generated_by_admin_id' => $adminId,
                        'payment_method' => $method,
                        'payment_status' => $isPaid ? 'paid' : 'unpaid',
                        'paid_at' => $paidAt,
                        'notes' => $this->noteFor($profile, $prime, $overtime),
                    ]
                );
            }
        }
    }

    private function shouldSkipPayroll(string $profile, int $periodIndex, int $total): bool
    {
        $current = $total - 1;
        $previous = $total - 2;

        return match ($profile) {
            'intern' => $periodIndex < $current,
            'gap' => $periodIndex >= $previous,
            'new' => $periodIndex < $total - 3,
            default => false,
        };
    }

    private function isPaid(string $profile, int $periodIndex, int $total): bool
    {
        $current = $total - 1;

        if ($periodIndex === $current) {
            return in_array($profile, ['regular', 'bonus', 'cash'], true) && $periodIndex % 2 === 0;
        }

        if ($profile === 'late') {
            return $periodIndex < $current - 1;
        }

        return $periodIndex < $current;
    }

    private function primeFor(string $profile, int $periodIndex, int $total): float
    {
        if ($profile === 'bonus' && $periodIndex === $total - 1) {
            return 350000;
        }
        if ($profile === 'bonus' && $periodIndex === $total - 3) {
            return 120000;
        }
        if ($profile === 'regular' && $periodIndex === 3) {
            return 50000;
        }

        return 0;
    }

    private function overtimeFor(string $profile, int $periodIndex): float
    {
        if (in_array($profile, ['bonus', 'gap', 'new'], true) && $periodIndex % 2 === 1) {
            return 8;
        }
        if ($profile === 'cash' && $periodIndex % 3 === 0) {
            return 4;
        }

        return 0;
    }

    private function noteFor(string $profile, float $prime, float $overtime): ?string
    {
        if ($prime > 0 && $overtime > 0) {
            return 'Prime et heures supplémentaires ce mois-ci.';
        }
        if ($prime > 0) {
            return 'Prime exceptionnelle incluse.';
        }
        if ($overtime > 0) {
            return 'Heures supplémentaires validées par le responsable.';
        }
        if ($profile === 'late') {
            return 'Paiement souvent décalé, à relancer.';
        }

        return null;
    }

    private function seedAgendaNotes(int $adminId): void
    {
        $now = Carbon::now();
        $notes = [
            [$now->copy()->startOfMonth()->addDays(2), 'Réunion RH', 'Point mensuel sur les embauches et les absences.'],
            [$now->copy()->startOfMonth()->addDays(7), 'Clôture paie', 'Vérifier les heures supplémentaires avant génération des fiches.'],
            [$now->copy()->day(min(12, $now->daysInMonth)), 'Versements CNAPS', 'Préparer le bordereau CNAPS du mois.'],
            [$now->copy()->day(min(18, $now->daysInMonth)), 'Entretien stagiaire', 'Suivi d’intégration de Tiana Razafy.'],
            [$now->copy()->day(min(25, $now->daysInMonth)), 'Rappel virements', 'Payer les fiches encore en statut non payé.'],
            [$now->copy()->subMonth()->day(10), 'Audit interne', 'Contrôle des dossiers employés et des contrats.'],
            [$now->copy()->subMonth()->day(22), 'Formation sécurité', 'Session obligatoire pour l’atelier et la logistique.'],
            [$now->copy()->day(min(4, $now->daysInMonth)), 'Commande fournitures', 'Renouveler les badges et les contrats d’assurance.'],
            [$now->copy()->day(min(15, $now->daysInMonth)), 'Comité de direction', 'Validation du budget masse salariale T4.'],
            [$now->copy()->day(min(20, $now->daysInMonth)), 'Visite médicale', 'Planifier les visites du personnel atelier.'],
            [$now->copy()->day(min(27, $now->daysInMonth)), 'Prévision octobre', 'Lister les embauches et les fins de stage.'],
            [$now->copy()->addMonth()->day(2), 'Rentrée paie', 'Ouvrir le cycle de paie du mois suivant.'],
            [$now->copy()->day(min(9, $now->daysInMonth)), 'Relance commercial', 'Hery et Hanitra : commissions du trimestre.'],
            [$now->copy()->day(min(16, $now->daysInMonth)), 'Maintenance IT', 'Mise à jour des postes développeurs.'],
            [$now->copy()->day(min(23, $now->daysInMonth)), 'Anniversaire entreprise', 'Prévoir une prime collective si le CA est atteint.'],
        ];

        foreach ($notes as [$date, $title, $note]) {
            AgendaNote::query()->updateOrCreate(
                [
                    'admin_id' => $adminId,
                    'date' => $date->toDateString(),
                    'title' => $title,
                ],
                ['note' => $note]
            );
        }
    }

    /**
     * @param  list<array{user: User, profile: string}>  $employees
     */
    private function seedInbox(array $employees, int $adminId): void
    {
        $andry = collect($employees)->first(fn (array $row) => $row['user']->email === 'andry.rakoto@demo.mg');
        $mialy = collect($employees)->first(fn (array $row) => $row['user']->email === 'mialy.andriamanana@demo.mg');
        if (! $andry) {
            return;
        }

        $andryId = $andry['user']->id;

        InboxMessage::query()->updateOrCreate(
            ['user_id' => $andryId, 'author' => 'admin', 'body' => 'Bonjour Andry, vos fiches de paie du trimestre sont disponibles dans votre espace.'],
            ['admin_id' => $adminId, 'read_at' => null]
        );
        InboxMessage::query()->updateOrCreate(
            ['user_id' => $andryId, 'author' => 'user', 'body' => 'Merci, je vais les télécharger. Pouvez-vous confirmer la date du prochain virement ?'],
            ['admin_id' => null, 'read_at' => null]
        );

        PlatformNotification::query()->updateOrCreate(
            [
                'audience' => 'user',
                'user_id' => $andryId,
                'type' => 'payroll_created',
                'title' => 'Nouvelle fiche de paie',
            ],
            [
                'body' => 'Votre dernière fiche est disponible au téléchargement.',
                'link' => '/payrolls',
                'read_at' => null,
            ]
        );
        PlatformNotification::query()->updateOrCreate(
            [
                'audience' => 'admin',
                'type' => 'message',
                'title' => 'Message de Andry Rakoto',
            ],
            [
                'user_id' => null,
                'body' => 'Merci, je vais les télécharger. Pouvez-vous confirmer la date du prochain virement ?',
                'link' => '/admin/messages/'.$andryId,
                'read_at' => null,
            ]
        );

        if ($mialy) {
            InboxMessage::query()->updateOrCreate(
                ['user_id' => $mialy['user']->id, 'author' => 'admin', 'body' => 'Mialy, merci de vérifier les justificatifs CNAPS avant vendredi.'],
                ['admin_id' => $adminId, 'read_at' => null]
            );
        }
    }
}
