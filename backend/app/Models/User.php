<?php

namespace App\Models;

use App\Enums\UserRole;
use App\Models\Scopes\MembershipScope;
use App\Support\TenantContext;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /** Agency stored on the user row, kept while another agency is active. */
    public ?int $homeTenantId = null;

    protected $fillable = [
        'name',
        'email',
        'password',
        'tenant_id',
        'role',
        'workspace_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected static function booted(): void
    {
        static::addGlobalScope(new MembershipScope);

        static::creating(function (User $user): void {
            if ($user->tenant_id !== null) {
                return;
            }

            $tenantId = app(TenantContext::class)->id();

            if ($tenantId !== null) {
                $user->tenant_id = $tenantId;
            }
        });

        static::created(function (User $user): void {
            if ($user->tenant_id === null || $user->role === null) {
                return;
            }

            Membership::query()->firstOrCreate(
                [
                    'user_id' => $user->id,
                    'tenant_id' => $user->tenant_id,
                ],
                [
                    'role' => $user->role,
                    'workspace_id' => $user->workspace_id,
                ],
            );
        });

        static::retrieved(function (User $user): void {
            $tenantId = app(TenantContext::class)->id();

            if ($tenantId === null) {
                return;
            }

            $membership = Membership::query()
                ->where('user_id', $user->id)
                ->where('tenant_id', $tenantId)
                ->first();

            if ($membership !== null) {
                $user->adopt($membership);
            }
        });
    }

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
        ];
    }

    /** Applies the agency link to this request without saving it. */
    public function adopt(Membership $membership): void
    {
        if ($this->homeTenantId === null) {
            $raw = $this->getRawOriginal('tenant_id');
            $this->homeTenantId = $raw === null ? (int) $membership->tenant_id : (int) $raw;
        }

        $this->tenant_id = $membership->tenant_id;
        $this->role = $membership->role;
        $this->workspace_id = $membership->workspace_id;
        $this->syncOriginalAttribute('tenant_id');
        $this->syncOriginalAttribute('role');
        $this->syncOriginalAttribute('workspace_id');
        $this->unsetRelation('tenant');
        $this->unsetRelation('workspace');
    }

    /** Lists the agencies this person can open. */
    public function memberships(): HasMany
    {
        return $this->hasMany(Membership::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }
}
