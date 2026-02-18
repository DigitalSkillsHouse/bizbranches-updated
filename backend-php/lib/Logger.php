<?php

class Logger {
    public static function log(string ...$args): void {
        if (isProd()) return;
        error_log('[LOG] ' . implode(' ', $args));
    }

    public static function warn(string ...$args): void {
        if (isProd()) return;
        error_log('[WARN] ' . implode(' ', $args));
    }

    public static function info(string ...$args): void {
        if (isProd()) return;
        error_log('[INFO] ' . implode(' ', $args));
    }

    public static function error(string ...$args): void {
        error_log('[ERROR] ' . implode(' ', $args));
    }
}
