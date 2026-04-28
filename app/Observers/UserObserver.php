<?php

namespace App\Observers;

use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UserObserver
{
    public function created(User $user): void
    {
        // Créer un dossier avec le nom de l'employé dans public/storage
        $folderName = $this->generateEmployeeFolderName($user);
        $base = "employees/{$folderName}";

        // Créer le dossier principal de l'employé et les sous-dossiers
        Storage::disk('public')->makeDirectory($base);
        Storage::disk('public')->makeDirectory("{$base}/images");
        Storage::disk('public')->makeDirectory("{$base}/documents");
        Storage::disk('public')->makeDirectory("{$base}/payrolls");
    }

    /**
     * Générer le nom du dossier de l'employé
     * Format: FirstName-LastName-ID (ex: Jean-Dupont-1)
     */
    private function generateEmployeeFolderName(User $user): string
    {
        $firstName = Str::slug($user->first_name ?? '');
        $lastName = Str::slug($user->last_name ?? '');

        return "{$firstName}-{$lastName}-{$user->id}";
    }
}

