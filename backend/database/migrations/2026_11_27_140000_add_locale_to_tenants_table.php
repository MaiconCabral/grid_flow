<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Adds the agency language, defaulting existing agencies to English. */
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('locale')->default('en');
        });
    }

    /** Removes the agency language. */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn('locale');
        });
    }
};
