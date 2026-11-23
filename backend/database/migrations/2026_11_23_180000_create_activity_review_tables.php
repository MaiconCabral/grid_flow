<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('activity_id')->constrained()->cascadeOnDelete();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedInteger('number');
            $table->string('kind');
            $table->string('name');
            $table->string('path')->nullable();
            $table->string('url')->nullable();
            $table->boolean('is_current')->default(false);
            $table->timestamps();

            $table->unique(['activity_id', 'number']);
        });

        Schema::create('activity_annotations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('activity_version_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedInteger('number');
            $table->decimal('x', 5, 2);
            $table->decimal('y', 5, 2);
            $table->timestamps();
        });

        Schema::create('activity_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('activity_id')->constrained()->cascadeOnDelete();
            $table->foreignId('activity_version_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('annotation_id')->nullable()->constrained('activity_annotations')->nullOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('activity_comments')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->text('body');
            $table->boolean('is_internal')->default(false);
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
        });

        $this->copyAssets();
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_comments');
        Schema::dropIfExists('activity_annotations');
        Schema::dropIfExists('activity_versions');
    }

    /** Turns each existing delivery into a version, keeping the latest current. */
    private function copyAssets(): void
    {
        $grouped = DB::table('activity_assets')->orderBy('id')->get()->groupBy('activity_id');

        foreach ($grouped as $rows) {
            $lastId = $rows->last()->id;
            $number = 1;

            foreach ($rows as $row) {
                DB::table('activity_versions')->insert([
                    'tenant_id' => $row->tenant_id,
                    'activity_id' => $row->activity_id,
                    'uploaded_by' => $row->uploaded_by,
                    'number' => $number,
                    'kind' => $row->kind,
                    'name' => $row->name,
                    'path' => $row->path,
                    'url' => $row->url,
                    'is_current' => $row->id === $lastId,
                    'created_at' => $row->created_at,
                    'updated_at' => $row->updated_at,
                ]);
                $number++;
            }
        }
    }
};
