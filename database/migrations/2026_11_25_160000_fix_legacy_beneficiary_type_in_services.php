<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Normaliza valores antiguos de beneficiary_type al value actual del enum
     * App\Enums\BeneficiaryType ('municipal' -> 'municipalidad').
     */
    public function up(): void
    {
        DB::table('services')
            ->where('beneficiary_type', 'municipal')
            ->update(['beneficiary_type' => 'municipalidad']);
    }

    public function down(): void
    {
        DB::table('services')
            ->where('beneficiary_type', 'municipalidad')
            ->update(['beneficiary_type' => 'municipal']);
    }
};
