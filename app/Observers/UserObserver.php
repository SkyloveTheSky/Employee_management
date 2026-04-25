<?php

namespace App\Observers;

use App\Models\User;
use Illuminate\Support\Facades\Storage;

class UserObserver
{
    public function created(User $user): void
    {
        $base = "users/{$user->id}";
        Storage::disk('local')->makeDirectory("{$base}/images");
        Storage::disk('local')->makeDirectory("{$base}/pdfs");
        Storage::disk('local')->makeDirectory("{$base}/payrolls");
    }
}

