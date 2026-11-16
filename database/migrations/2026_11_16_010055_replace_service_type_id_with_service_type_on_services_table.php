<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Columna nueva, nullable mientras se rellena
        Schema::table('services', function (Blueprint $table) {
            $table->string('service_type', 20)->nullable()->after('deceased_id');
        });

        // 2. Rellenar desde la tabla antigua, si todavía existe
        if (Schema::hasTable('service_types') && Schema::hasColumn('services', 'service_type_id')) {
            DB::statement("
                UPDATE services
                SET service_type = CASE
                    WHEN st.name ILIKE '%urna%' THEN 'urna'
                    ELSE 'ataud'
                END
                FROM service_types st
                WHERE st.id = services.service_type_id
            ");
        }

        // Cualquier fila sin tipo queda como ataúd
        DB::table('services')->whereNull('service_type')->update(['service_type' => 'ataud']);

        // 3. Ahora sí, NOT NULL
        DB::statement('ALTER TABLE services ALTER COLUMN service_type SET NOT NULL');

        // 4. Quitar la columna antigua
        if (Schema::hasColumn('services', 'service_type_id')) {
            Schema::table('services', function (Blueprint $table) {
                $table->dropForeign(['service_type_id']);
                $table->dropColumn('service_type_id');
            });
        }
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn('service_type');
        });
    }
};