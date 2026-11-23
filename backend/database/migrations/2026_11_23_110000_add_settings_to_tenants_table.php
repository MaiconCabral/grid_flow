<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Adds the agency theme, colors, and plan. */
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('theme')->default('dark');
            $table->string('light_background', 7)->default('#f0f1ed');
            $table->string('dark_background', 7)->default('#111313');
            $table->string('accent', 7)->default('#bbff52');
            $table->string('plan')->default('studio');
        });
    }

    /** Removes the agency theme, colors, and plan. */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['theme', 'light_background', 'dark_background', 'accent', 'plan']);
        });
    }
};
