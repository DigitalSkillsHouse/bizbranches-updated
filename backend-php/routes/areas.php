<?php

function registerAreasRoutes(Router $router): void {
    $router->get('/api/areas', function($params) {
        $cityId = trim($_GET['cityId'] ?? '');
        if (!$cityId) Response::error('cityId is required', 400);

        try {
            $data = Courier::get('/areas?cityId=' . urlencode($cityId));
            if ($data) {
                $areas = $data['data'] ?? $data['areas'] ?? $data;
                if (is_array($areas)) {
                    Response::success(['areas' => $areas]);
                    return;
                }
            }
            Response::success(['areas' => []]);
        } catch (Exception $e) {
            Logger::error('Error fetching areas:', $e->getMessage());
            Response::error('Failed to fetch areas', 500);
        }
    });
}
