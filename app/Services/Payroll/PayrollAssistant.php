<?php

namespace App\Services\Payroll;

use Illuminate\Support\Facades\Http;

class PayrollAssistant
{
    public function __construct(private AnomalyDetector $detector)
    {
    }

    public function ask(string $message): array
    {
        $message = trim($message);
        if ($message === '') {
            return [
                'reply'   => 'Décrivez une situation : par exemple « qui n’est pas payé ce mois-ci ? » ou « génère mars pour ceux sans fiche ».',
                'actions' => [],
            ];
        }

        $intent = $this->interpret($message);

        return $this->handleIntent($intent, $message);
    }

    private function interpret(string $message): array
    {
        $fromLlm = $this->interpretWithLlm($message);
        if ($fromLlm) {
            return $fromLlm;
        }

        return $this->interpretWithRules($message);
    }

    private function interpretWithLlm(string $message): ?array
    {
        $key = config('payroll.openai_key');
        if (! $key) {
            return null;
        }

        $overview = $this->detector->overview();
        $period   = now()->format('Y-m');

        try {
            $response = Http::timeout(20)
                ->withToken($key)
                ->acceptJson()
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model'           => config('payroll.openai_model', 'gpt-4o-mini'),
                    'response_format' => ['type' => 'json_object'],
                    'messages'        => [
                        [
                            'role'    => 'system',
                            'content' => 'Tu es un assistant paie. Tu ne paies jamais toi-même. Réponds UNIQUEMENT en JSON : {"intent":"generate_missing|list_unpaid|check_prime|missing_coverage|unknown","period":"YYYY-MM ou null","reply":"phrase courte en français"}. intent generate_missing = créer des fiches manquantes pour un mois. list_unpaid = qui n’est pas payé. check_prime = anomalie de prime. missing_coverage = employés sans fiche depuis 2 mois. Période actuelle : '.$period.'.',
                        ],
                        [
                            'role'    => 'user',
                            'content' => $message."\n\nContexte : ".json_encode([
                                'unpaid_count'  => count($overview['unpaid']),
                                'missing_count' => count($overview['missing']),
                            ], JSON_UNESCAPED_UNICODE),
                        ],
                    ],
                ]);

            if (! $response->successful()) {
                return null;
            }

            $content = data_get($response->json(), 'choices.0.message.content');
            $decoded = json_decode((string) $content, true);

            return is_array($decoded) ? $decoded : null;
        } catch (\Throwable) {
            return null;
        }
    }

    private function interpretWithRules(string $message): array
    {
        $normalized = $this->normalize($message);
        $period     = $this->extractPeriod($normalized) ?? now()->format('Y-m');

        if (preg_match('/(sans fiche|pas (encore )?de fiche|manquante|genere|génér)/u', $normalized)
            && preg_match('/(tous|ceux|employe|fiche|mois|janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre)/u', $normalized)) {
            return ['intent' => 'generate_missing', 'period' => $period, 'reply' => null];
        }

        if (preg_match('/(pas paye|non paye|impaye|pas encore pay)/u', $normalized)) {
            return ['intent' => 'list_unpaid', 'period' => $period, 'reply' => null];
        }

        if (preg_match('/(prime|anormal|eleve|élev)/u', $normalized)) {
            return ['intent' => 'check_prime', 'period' => $period, 'reply' => null];
        }

        if (preg_match('/(2 mois|deux mois|sans paie|pas de paie)/u', $normalized)) {
            return ['intent' => 'missing_coverage', 'period' => $period, 'reply' => null];
        }

        return ['intent' => 'unknown', 'period' => $period, 'reply' => null];
    }

    private function handleIntent(array $intent, string $original): array
    {
        $type   = $intent['intent'] ?? 'unknown';
        $period = $intent['period'] ?? now()->format('Y-m');
        if (! is_string($period) || ! preg_match('/^\d{4}-\d{2}$/', $period)) {
            $period = $this->extractPeriod($this->normalize($original)) ?? now()->format('Y-m');
        }

        return match ($type) {
            'generate_missing' => $this->suggestGenerateMissing($period),
            'list_unpaid'      => $this->suggestUnpaid($period),
            'check_prime'      => $this->suggestPrimeCheck($original),
            'missing_coverage' => $this->suggestMissingCoverage(),
            default            => [
                'reply'   => $intent['reply'] ?: 'Je peux : lister les non payés, signaler une prime anormale, ou proposer de générer les fiches manquantes d’un mois. Je ne paie jamais automatiquement.',
                'actions' => [],
            ],
        };
    }

    private function suggestGenerateMissing(string $period): array
    {
        $missing = $this->detector->employeesWithoutPayroll($period);
        $label   = $this->detector->periodLabel($period);

        if ($missing === []) {
            return [
                'reply'   => 'Tous les employés ont déjà une fiche pour '.$label.'.',
                'actions' => [],
            ];
        }

        $names = collect($missing)->pluck('name')->take(8)->implode(', ');
        $more  = count($missing) > 8 ? '…' : '';

        return [
            'reply'   => count($missing).' employé(s) sans fiche en '.$label.' : '.$names.$more.'. Je propose de les générer ; rien n’est créé tant que vous ne confirmez pas.',
            'actions' => [[
                'type'     => 'generate_missing',
                'label'    => 'Générer '.count($missing).' fiche(s) pour '.$label,
                'period'   => $period,
                'user_ids' => collect($missing)->pluck('id')->all(),
            ]],
        ];
    }

    private function suggestUnpaid(string $period): array
    {
        $overview = $this->detector->overview($period);
        $label    = $this->detector->periodLabel($period);
        $unpaid   = $overview['unpaid'];

        if ($unpaid === []) {
            return [
                'reply'   => 'Aucune fiche non payée pour '.$label.'.',
                'actions' => [[
                    'type'   => 'filter_unpaid',
                    'label'  => 'Voir le suivi de '.$label,
                    'period' => $period,
                ]],
            ];
        }

        $names = collect($unpaid)->pluck('name')->take(8)->implode(', ');

        return [
            'reply'   => count($unpaid).' fiche(s) non payée(s) en '.$label.' : '.$names.'. Filtrez le suivi pour les traiter. Le marquage payé reste manuel.',
            'actions' => [[
                'type'   => 'filter_unpaid',
                'label'  => 'Afficher les non payés de '.$label,
                'period' => $period,
            ]],
        ];
    }

    private function suggestPrimeCheck(string $message): array
    {
        preg_match('/(\d[\d\s]*)/', str_replace("\u{00A0}", ' ', $message), $match);
        $amount = isset($match[1]) ? (float) str_replace(' ', '', $match[1]) : 0;

        if ($amount <= 0) {
            return [
                'reply'   => 'Indiquez le montant de la prime (ex. « une prime de 200000 Ar est-elle anormale ? ») ou saisissez-la dans le formulaire : le contrôle s’enclenche avant génération.',
                'actions' => [],
            ];
        }

        $ratio = (float) config('payroll.prime_warning_ratio', 0.5);
        $flagged = [];
        foreach (\App\Models\User::query()->select('id', 'first_name', 'last_name', 'salary_base')->get() as $user) {
            $base = (float) ($user->salary_base ?? 0);
            if ($base > 0 && $amount / $base >= $ratio) {
                $flagged[] = trim($user->first_name.' '.$user->last_name).' (base '.number_format($base, 0, ',', ' ').' Ar)';
            }
        }

        if ($flagged === []) {
            return [
                'reply'   => number_format($amount, 0, ',', ' ').' Ar reste sous le seuil d’alerte ('.round($ratio * 100).' % du salaire de base) pour les employés actuels.',
                'actions' => [],
            ];
        }

        return [
            'reply'   => number_format($amount, 0, ',', ' ').' Ar serait une prime élevée pour : '.implode(', ', array_slice($flagged, 0, 8)).'. Le formulaire affichera aussi cette alerte avant enregistrement.',
            'actions' => [],
        ];
    }

    private function suggestMissingCoverage(): array
    {
        $missing = $this->detector->overview()['missing'];
        if ($missing === []) {
            return [
                'reply'   => 'Tous les employés ont au moins une fiche sur les 2 derniers mois.',
                'actions' => [],
            ];
        }

        $names = collect($missing)->pluck('name')->take(8)->implode(', ');

        return [
            'reply'   => count($missing).' employé(s) sans fiche depuis 2 mois : '.$names.'.',
            'actions' => [],
        ];
    }

    private function extractPeriod(string $normalized): ?string
    {
        if (preg_match('/(\d{4})-(\d{2})/', $normalized, $match)) {
            return $match[1].'-'.$match[2];
        }

        $months = [
            'janvier' => 1, 'fevrier' => 2, 'février' => 2, 'mars' => 3, 'avril' => 4,
            'mai' => 5, 'juin' => 6, 'juillet' => 7, 'aout' => 8, 'août' => 8,
            'septembre' => 9, 'octobre' => 10, 'novembre' => 11, 'decembre' => 12, 'décembre' => 12,
        ];

        $year = (int) now()->year;
        if (preg_match('/(20\d{2})/', $normalized, $yearMatch)) {
            $year = (int) $yearMatch[1];
        }

        foreach ($months as $name => $number) {
            if (str_contains($normalized, $this->normalize($name)) || str_contains($normalized, $name)) {
                return sprintf('%04d-%02d', $year, $number);
            }
        }

        if (str_contains($normalized, 'mois dernier') || str_contains($normalized, 'le mois passe')) {
            return now()->subMonth()->format('Y-m');
        }

        if (str_contains($normalized, 'ce mois') || str_contains($normalized, 'mois ci')) {
            return now()->format('Y-m');
        }

        return null;
    }

    private function normalize(string $text): string
    {
        $text = mb_strtolower($text);
        $text = strtr($text, ['é' => 'e', 'è' => 'e', 'ê' => 'e', 'à' => 'a', 'ù' => 'u', 'ô' => 'o', 'î' => 'i', 'ç' => 'c', '’' => "'"]);

        return $text;
    }
}
