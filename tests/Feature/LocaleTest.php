<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LocaleTest extends TestCase
{
    use RefreshDatabase;

    public function test_default_locale_is_french(): void
    {
        $this->get('/login')->assertInertia(fn (Assert $page) => $page
            ->component('Auth/Login')
            ->where('locale', 'fr')
        );
    }

    public function test_guest_can_switch_to_english(): void
    {
        $this->from('/login')->get('/locale/en')->assertRedirect('/login');

        $this->get('/login')->assertInertia(fn (Assert $page) => $page
            ->where('locale', 'en')
        );
    }

    public function test_invalid_locale_falls_back_to_french(): void
    {
        $this->from('/login')->get('/locale/es')->assertRedirect('/login');

        $this->get('/login')->assertInertia(fn (Assert $page) => $page
            ->where('locale', 'fr')
        );
    }
}
