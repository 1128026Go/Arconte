<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

class CacheService
{
    /**
     * Cache TTL constants (in seconds)
     */
    const CASE_LIST_TTL = 300; // 5 minutes
    const CASE_DETAIL_TTL = 180; // 3 minutes
    const ANALYTICS_TTL = 600; // 10 minutes
    const NOTIFICATIONS_TTL = 60; // 1 minute
    const USER_PROFILE_TTL = 3600; // 1 hour

    /**
     * Get cached value or execute callback and cache result
     *
     * @param string $key
     * @param int $ttl
     * @param callable $callback
     * @return mixed
     */
    public function remember(string $key, int $ttl, callable $callback)
    {
        return Cache::remember($key, $ttl, $callback);
    }

    /**
     * Clear cache for user's cases
     *
     * @param int $userId
     * @return void
     */
    public function clearUserCases(int $userId): void
    {
        Cache::forget("cases.user.{$userId}");
        Cache::forget("analytics.dashboard.{$userId}");
    }

    /**
     * Clear cache for specific case
     *
     * @param int $caseId
     * @return void
     */
    public function clearCase(int $caseId): void
    {
        Cache::forget("case.detail.{$caseId}");
    }

    /**
     * Clear notification cache for user
     *
     * @param int $userId
     * @return void
     */
    public function clearUserNotifications(int $userId): void
    {
        Cache::forget("notifications.user.{$userId}");
        Cache::forget("notifications.stats.{$userId}");
    }

    /**
     * Clear all cache for user (useful after logout or major changes)
     *
     * @param int $userId
     * @return void
     */
    public function clearAllForUser(int $userId): void
    {
        $this->clearUserCases($userId);
        $this->clearUserNotifications($userId);
        Cache::forget("user.profile.{$userId}");
        Cache::forget("user.subscription.{$userId}");
    }

    /**
     * Get cache tags for better organization
     *
     * @param int $userId
     * @return array
     */
    public function getUserTags(int $userId): array
    {
        return ["user:{$userId}"];
    }

    /**
     * Flush cache by tags (if Redis is used with tagging support)
     *
     * @param array $tags
     * @return void
     */
    public function flushTags(array $tags): void
    {
        if (config('cache.default') === 'redis') {
            Cache::tags($tags)->flush();
        }
    }
}
