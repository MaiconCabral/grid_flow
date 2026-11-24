<?php

namespace App\Http\Controllers\Api;

use App\Actions\Auth\LoginUser;
use App\Actions\Auth\LogoutUser;
use App\Actions\Auth\RegisterAgency;
use App\Actions\Auth\SwitchAgency;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterAgencyRequest;
use App\Http\Requests\Auth\SwitchAgencyRequest;
use App\Support\AuthSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class AuthController extends Controller
{
    public function register(RegisterAgencyRequest $request, RegisterAgency $action): JsonResponse
    {
        return response()->json($action->handle($request->validated()), 201);
    }

    public function login(LoginRequest $request, LoginUser $action): JsonResponse
    {
        return response()->json($action->handle($request->string('email')->toString(), $request->string('password')->toString()));
    }

    public function logout(Request $request, LogoutUser $action): Response
    {
        $action->handle($request->user(), $request->bearerToken());

        return response()->noContent();
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(AuthSession::payload($request->user()));
    }

    /** Switches the session to another agency of the signed-in person. */
    public function switchAgency(SwitchAgencyRequest $request, SwitchAgency $action): JsonResponse
    {
        return response()->json($action->handle($request->user(), (int) $request->validated('tenant_id')));
    }
}
