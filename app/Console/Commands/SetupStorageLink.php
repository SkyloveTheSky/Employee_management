<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class SetupStorageLink extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'storage:setup';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Crée le lien symbolique de stockage et le dossier employees';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $target = storage_path('app/public');
        $link = public_path('storage');

        if (is_link($link)) {
            $this->info('Le lien symbolique existe déjà.');
            return Command::SUCCESS;
        }

        if (File::exists($link) && !is_link($link)) {
            $this->error('Un fichier ou dossier existe déjà à: ' . $link);
            return Command::FAILURE;
        }

        try {
            // Sur Windows
            if (PHP_OS_FAMILY === 'Windows') {
                $cmd = sprintf(
                    'mklink /D %s %s',
                    escapeshellarg(str_replace('/', '\\', $link)),
                    escapeshellarg(str_replace('/', '\\', $target))
                );
            } else {
                // Sur Linux/Mac
                $cmd = sprintf('ln -s %s %s', $target, $link);
            }

            exec($cmd, $output, $returnCode);

            if ($returnCode === 0) {
                $this->info('Lien symbolique créé avec succès: ' . $link);
                return Command::SUCCESS;
            } else {
                $this->error('Erreur lors de la création du lien symbolique.');
                return Command::FAILURE;
            }
        } catch (\Exception $e) {
            $this->error('Erreur: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
