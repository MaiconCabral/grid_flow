<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activity_versions', function (Blueprint $table) {
            $table->string('headline')->nullable()->after('name');
            $table->text('caption')->nullable()->after('headline');
        });

        Schema::table('activity_version_files', function (Blueprint $table) {
            $table->string('role')->default('asset')->after('position');
        });

        Schema::table('activity_comments', function (Blueprint $table) {
            $table->string('scope')->default('asset')->after('body');
        });

        DB::table('activities')->where('format', 'text')->update(['format' => 'blog']);
    }

    public function down(): void
    {
        DB::table('activities')->where('format', 'blog')->update(['format' => 'text']);

        Schema::table('activity_comments', function (Blueprint $table) {
            $table->dropColumn('scope');
        });

        Schema::table('activity_version_files', function (Blueprint $table) {
            $table->dropColumn('role');
        });

        Schema::table('activity_versions', function (Blueprint $table) {
            $table->dropColumn(['headline', 'caption']);
        });
    }
};
