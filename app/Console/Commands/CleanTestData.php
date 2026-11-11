<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('app:clean-test-data')]
#[Description('Command description')]
class CleanTestData extends Command
{
    /**
     * Execute the console command.
     */
    public function handle()
    {
        //
    }
}
