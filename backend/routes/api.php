<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\WorkspaceController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('auth/register', [AuthController::class, 'register']);
    Route::post('auth/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('auth/logout', [AuthController::class, 'logout']);

        Route::middleware('tenant')->group(function () {
            Route::get('auth/me', [AuthController::class, 'me']);
            Route::get('users', [UserController::class, 'index']);
            Route::post('users', [UserController::class, 'store']);
            Route::patch('users/{user}', [UserController::class, 'update']);
            Route::delete('users/{user}', [UserController::class, 'destroy']);
            Route::get('workspaces', [WorkspaceController::class, 'index']);
            Route::post('workspaces', [WorkspaceController::class, 'store']);
            Route::patch('workspaces/{workspace}', [WorkspaceController::class, 'update']);
            Route::delete('workspaces/{workspace}', [WorkspaceController::class, 'destroy']);
        });
    });
});
