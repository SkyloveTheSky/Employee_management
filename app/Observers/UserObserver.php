<?php

namespace App\Observers;

use App\Models\User;
use Illuminate\Support\Facades\Storage;

class UserObserver
{
    public function created(User $user): void
    {
        $base = $user->employeeFolder();

        Storage::disk('public')->makeDirectory($base);
        Storage::disk('public')->makeDirectory("{$base}/images");
        Storage::disk('public')->makeDirectory("{$base}/documents");
        Storage::disk('public')->makeDirectory("{$base}/payrolls");
    }

    public function deleted(User $user): void
    {
        Storage::disk('public')->deleteDirectory($user->employeeFolder());
    }
}
