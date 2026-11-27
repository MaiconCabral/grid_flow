<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\UserNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /** Lists the recent notices for the signed-in person. */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $items = UserNotification::query()
            ->where('user_id', $user->id)
            ->latest('id')
            ->limit(20)
            ->get();

        return response()->json([
            'data' => $items->map(fn (UserNotification $item) => $item->present($this->slug($user->tenant_id), $user->role))->values(),
            'unread' => UserNotification::query()->where('user_id', $user->id)->whereNull('read_at')->count(),
        ]);
    }

    /** Marks one notice as read for its recipient. */
    public function read(Request $request, UserNotification $notification): JsonResponse
    {
        if ($notification->read_at === null) {
            $notification->forceFill(['read_at' => now()])->save();
        }

        $user = $request->user();

        return response()->json($notification->present($this->slug($user->tenant_id), $user->role));
    }

    /** Reads the slug of the agency open on this request. */
    private function slug(?int $tenantId): string
    {
        return (string) Tenant::query()->whereKey($tenantId)->value('slug');
    }
}
