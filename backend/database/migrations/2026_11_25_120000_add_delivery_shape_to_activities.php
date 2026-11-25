<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->string('storage_key')->nullable()->after('due_on');
            $table->string('cover_from')->nullable()->after('storage_key');
            $table->string('cover_to')->nullable()->after('cover_from');
            $table->string('briefing_name')->nullable()->after('cover_to');
            $table->string('briefing_path')->nullable()->after('briefing_name');
        });

        Schema::create('activity_version_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('activity_version_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('position');
            $table->string('name');
            $table->string('path')->nullable();
            $table->string('url')->nullable();
            $table->timestamps();

            $table->unique(['activity_version_id', 'position']);
        });

        $this->backfillActivities();
        $this->copyVersionFiles();

        Schema::table('activities', function (Blueprint $table) {
            $table->unique(['tenant_id', 'storage_key']);
        });

        Schema::table('activity_annotations', function (Blueprint $table) {
            $table->foreignId('activity_version_file_id')->nullable()->after('activity_version_id')->constrained('activity_version_files')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('activity_annotations', function (Blueprint $table) {
            $table->dropConstrainedForeignId('activity_version_file_id');
        });

        Schema::dropIfExists('activity_version_files');

        Schema::table('activities', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'storage_key']);
            $table->dropColumn(['storage_key', 'cover_from', 'cover_to', 'briefing_name', 'briefing_path']);
        });
    }

    /** Gives each existing task a folder name and a cover gradient. */
    private function backfillActivities(): void
    {
        $tones = [
            ['#1f4d3a', '#bbff52'],
            ['#243056', '#9ed9ef'],
            ['#4a2348', '#f5a8bf'],
            ['#3d2a12', '#f7d37c'],
            ['#1c3330', '#7ddec3'],
        ];

        foreach (DB::table('activities')->orderBy('id')->get() as $index => $row) {
            $name = DB::table('workspaces')->where('id', $row->workspace_id)->value('name') ?? 'brand';
            $slug = Str::slug((string) $name, '_') ?: 'brand';
            $tone = $tones[$index % count($tones)];

            DB::table('activities')->where('id', $row->id)->update([
                'storage_key' => $slug.'_'.substr(md5((string) $row->id), 0, 6),
                'cover_from' => $tone[0],
                'cover_to' => $tone[1],
            ]);
        }
    }

    /** Copies the single file on each version into the first slide. */
    private function copyVersionFiles(): void
    {
        foreach (DB::table('activity_versions')->orderBy('id')->get() as $version) {
            if ($version->path === null && $version->url === null) {
                continue;
            }

            DB::table('activity_version_files')->insert([
                'tenant_id' => $version->tenant_id,
                'activity_version_id' => $version->id,
                'position' => 0,
                'name' => $version->name,
                'path' => $version->path,
                'url' => $version->url,
                'created_at' => $version->created_at,
                'updated_at' => $version->updated_at,
            ]);
        }
    }
};
