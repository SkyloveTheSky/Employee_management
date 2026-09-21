<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        if (config('database.default') !== 'sqlite') {
            throw new \RuntimeException('Les tests doivent utiliser sqlite, jamais la base MySQL de l’application.');
        }
    }
}
