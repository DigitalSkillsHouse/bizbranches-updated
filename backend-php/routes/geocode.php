<?php

function registerGeocodeRoutes(Router $router): void {
    $router->get('/api/geocode', function($params) {
        $ip = RateLimit::getClientIp();
        $rl = RateLimit::check($ip, 'geocode', 20);
        if (!$rl['ok']) Response::error('Too many requests', 429);

        $address = trim($_GET['address'] ?? '');
        $city = trim($_GET['city'] ?? '');
        $area = trim($_GET['area'] ?? '');
        $country = trim($_GET['country'] ?? 'Pakistan');

        if (!$address && !$city) Response::error('address or city is required', 400);

        $result = Geocode::geocodeAddress($address, $city, $area, $country);
        if (!$result) Response::error('Could not geocode address', 404);

        Response::success([
            'latitude' => $result['latitude'],
            'longitude' => $result['longitude'],
            'displayName' => $result['displayName'] ?? null,
        ]);
    });
}
