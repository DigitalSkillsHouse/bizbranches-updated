<?php

class Courier {
    private static ?string $token = null;
    private static int $tokenExpiry = 0;

    public static function getBaseUrl(): string {
        return env('LEOPARDS_API_BASE_URL', env('COURIER_API_BASE_URL', ''));
    }

    private static function getToken(): ?string {
        if (self::$token && time() < self::$tokenExpiry) return self::$token;

        $base = self::getBaseUrl();
        $apiKey = env('LEOPARDS_API_KEY', env('COURIER_API_KEY'));
        $username = env('LEOPARDS_API_USERNAME', env('COURIER_API_USERNAME'));
        $password = env('LEOPARDS_API_PASSWORD', env('COURIER_API_PASSWORD'));

        if (!$base) return null;
        if ($apiKey) return $apiKey;
        if (!$username || !$password) return null;

        $loginPaths = ['/login', '/auth/login', '/token', '/merchant/login'];
        foreach ($loginPaths as $path) {
            try {
                $response = self::httpPost($base . $path, [
                    'username' => $username,
                    'password' => $password,
                    'api_key' => $apiKey ?? '',
                ]);
                if ($response && isset($response['token'])) {
                    self::$token = $response['token'];
                    self::$tokenExpiry = time() + 3600;
                    return self::$token;
                }
            } catch (Exception $e) {
                continue;
            }
        }
        return null;
    }

    public static function get(string $path): ?array {
        $base = self::getBaseUrl();
        if (!$base) return null;

        $token = self::getToken();
        $headers = ['Accept: application/json'];
        if ($token) $headers[] = "Authorization: Bearer $token";

        $ctx = stream_context_create([
            'http' => [
                'header' => implode("\r\n", $headers),
                'timeout' => 10,
            ],
        ]);
        $response = @file_get_contents($base . $path, false, $ctx);
        if ($response === false) return null;
        return json_decode($response, true);
    }

    public static function post(string $path, array $body): ?array {
        $base = self::getBaseUrl();
        if (!$base) return null;
        return self::httpPost($base . $path, $body);
    }

    private static function httpPost(string $url, array $body): ?array {
        $token = self::$token;
        $headers = [
            'Content-Type: application/json',
            'Accept: application/json',
        ];
        if ($token) $headers[] = "Authorization: Bearer $token";

        $ctx = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => implode("\r\n", $headers),
                'content' => json_encode($body),
                'timeout' => 10,
            ],
        ]);
        $response = @file_get_contents($url, false, $ctx);
        if ($response === false) return null;
        return json_decode($response, true);
    }
}
