<?php

class Geocode {
    private const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';
    private const RATE_LIMIT_MS = 1100;
    private const CACHE_TTL = 86400; // 24 hours

    private static float $lastRequestTime = 0;
    private static array $cache = [];

    public static function geocodeAddress(string $address, string $city, ?string $area = null, string $country = 'Pakistan'): ?array {
        $query = implode(', ', array_filter([$address, $area, $city, $country]));
        if (empty(trim($query))) return null;

        $key = strtolower(implode('|', [trim($address), trim($city), trim($area ?? ''), trim($country)]));
        if (isset(self::$cache[$key]) && (time() - self::$cache[$key]['ts']) < self::CACHE_TTL) {
            return self::$cache[$key]['result'];
        }
        if (count(self::$cache) > 5000) {
            array_shift(self::$cache);
        }

        $apiKey = env('GOOGLE_GEOCODING_API_KEY');
        if ($apiKey) {
            $result = self::geocodeGoogle($query, $apiKey);
            if ($result) {
                self::$cache[$key] = ['result' => $result, 'ts' => time()];
                return $result;
            }
        }

        self::throttle();
        try {
            $params = http_build_query([
                'q' => $query,
                'format' => 'json',
                'limit' => '1',
                'countrycodes' => 'pk',
            ]);
            $ctx = stream_context_create([
                'http' => [
                    'header' => "User-Agent: BizBranches-Pakistan-Directory/1.0\r\n",
                    'timeout' => 8,
                ],
            ]);
            $response = @file_get_contents(self::NOMINATIM_BASE . '?' . $params, false, $ctx);
            if ($response === false) return null;

            $data = json_decode($response, true);
            if (!is_array($data) || empty($data)) return null;

            $first = $data[0];
            $lat = (float)($first['lat'] ?? 0);
            $lon = (float)($first['lon'] ?? 0);
            if ($lat != 0 || $lon != 0) {
                $result = [
                    'latitude' => $lat,
                    'longitude' => $lon,
                    'displayName' => $first['display_name'] ?? null,
                ];
                self::$cache[$key] = ['result' => $result, 'ts' => time()];
                return $result;
            }
        } catch (Exception $e) {
            Logger::warn('Geocode (Nominatim) failed:', $e->getMessage());
        }
        return null;
    }

    private static function throttle(): void {
        $now = microtime(true) * 1000;
        $elapsed = $now - self::$lastRequestTime;
        if ($elapsed < self::RATE_LIMIT_MS) {
            usleep((int)((self::RATE_LIMIT_MS - $elapsed) * 1000));
        }
        self::$lastRequestTime = microtime(true) * 1000;
    }

    private static function geocodeGoogle(string $query, string $apiKey): ?array {
        try {
            $params = http_build_query([
                'address' => $query,
                'key' => $apiKey,
                'region' => 'pk',
            ]);
            $ctx = stream_context_create(['http' => ['timeout' => 6]]);
            $response = @file_get_contents("https://maps.googleapis.com/maps/api/geocode/json?$params", false, $ctx);
            if ($response === false) return null;

            $data = json_decode($response, true);
            $loc = $data['results'][0]['geometry']['location'] ?? null;
            if ($loc && isset($loc['lat'], $loc['lng'])) {
                return [
                    'latitude' => (float)$loc['lat'],
                    'longitude' => (float)$loc['lng'],
                    'displayName' => $data['results'][0]['formatted_address'] ?? null,
                ];
            }
        } catch (Exception $e) {
            Logger::warn('Geocode (Google) failed:', $e->getMessage());
        }
        return null;
    }
}
