<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->foreignId('supplier_id')->nullable()->after('code')
                ->constrained()->onDelete('set null');
            
            $table->string('size', 50)->nullable()->after('material')
                ->comment('Adulto, Infantil, Especial');
            
            $table->string('customization', 100)->nullable()->after('size')
                ->comment('Tallado propio, liso, personalizado');
            
            $table->boolean('is_custom_order')->default(false)->after('customization')
                ->comment('Si se pide personalizado al proveedor');
        });
    }

    public function down(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('supplier_id');
            $table->dropColumn(['size', 'customization', 'is_custom_order']);
        });
    }
};