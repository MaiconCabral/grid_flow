<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('memberships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('role');
            $table->foreignId('workspace_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'tenant_id']);
        });

        $now = now();

        foreach (DB::table('users')->orderBy('id')->get() as $user) {
            DB::table('memberships')->insert([
                'user_id' => $user->id,
                'tenant_id' => $user->tenant_id,
                'role' => $user->role,
                'workspace_id' => $user->workspace_id,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $this->seedSharedDesigner();
    }

    public function down(): void
    {
        Schema::dropIfExists('memberships');
    }

    /** Adds the shared designer when both demo agencies already exist. */
    private function seedSharedDesigner(): void
    {
        $alpha = DB::table('tenants')->where('slug', 'agency-alpha')->first();
        $horizon = DB::table('tenants')->where('slug', 'horizon-studio')->first();

        if ($alpha === null || $horizon === null || DB::table('users')->where('email', 'maya@studios.test')->exists()) {
            return;
        }

        $now = now();
        $userId = DB::table('users')->insertGetId([
            'tenant_id' => $alpha->id,
            'name' => 'Maya Costa',
            'email' => 'maya@studios.test',
            'password' => Hash::make('password'),
            'role' => 'designer',
            'workspace_id' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        DB::table('memberships')->insert([
            [
                'user_id' => $userId,
                'tenant_id' => $alpha->id,
                'role' => 'designer',
                'workspace_id' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'user_id' => $userId,
                'tenant_id' => $horizon->id,
                'role' => 'designer',
                'workspace_id' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

        $this->seedTask($alpha->id, 'Aster & Co.', 'jordan@agency-alpha.test', $userId, 'Shared cutdown', 'A fifteen second cut Maya finishes for Aster.', 'instagram', 'video', 'production');
        $this->seedTask($horizon->id, 'Lumen Atelier', 'helena@horizon-studio.test', $userId, 'Studio still', 'One frame Maya retouches for the atelier.', 'instagram', 'post', 'todo');
    }

    /** Inserts one task and its opening history entry for the shared designer. */
    private function seedTask(
        int $tenantId,
        string $brand,
        string $authorEmail,
        int $assigneeId,
        string $title,
        string $briefing,
        string $channel,
        string $format,
        string $status,
    ): void {
        $workspace = DB::table('workspaces')->where('tenant_id', $tenantId)->where('name', $brand)->first();
        $author = DB::table('users')->where('email', $authorEmail)->first();

        if ($workspace === null || $author === null) {
            return;
        }

        $now = now();
        $activityId = DB::table('activities')->insertGetId([
            'tenant_id' => $tenantId,
            'workspace_id' => $workspace->id,
            'created_by' => $author->id,
            'assignee_id' => $assigneeId,
            'title' => $title,
            'briefing' => $briefing,
            'channel' => $channel,
            'format' => $format,
            'status' => $status,
            'due_on' => $now->toDateString(),
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        DB::table('activity_events')->insert([
            'tenant_id' => $tenantId,
            'activity_id' => $activityId,
            'actor_id' => $author->id,
            'type' => 'created',
            'to_status' => 'todo',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        if ($status === 'todo') {
            return;
        }

        DB::table('activity_events')->insert([
            'tenant_id' => $tenantId,
            'activity_id' => $activityId,
            'actor_id' => $author->id,
            'type' => 'status_changed',
            'from_status' => 'todo',
            'to_status' => $status,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }
};
