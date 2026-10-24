<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()->after('service_type_id')
                ->constrained()->onDelete('restrict');
        });

        Schema::table('inventory_items', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()->after('category')
                ->constrained()->onDelete('restrict');
        });

        Schema::table('vehicles', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()->after('type')
                ->constrained()->onDelete('restrict');
        });
    }

    public function down(): void
    {
        Schema::table('services', fn ($t) => $t->dropConstrainedForeignId('branch_id'));
        Schema::table('inventory_items', fn ($t) => $t->dropConstrainedForeignId('branch_id'));
        Schema::table('vehicles', fn ($t) => $t->dropConstrainedForeignId('branch_id'));
    }
};