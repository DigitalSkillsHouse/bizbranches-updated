<?php

function registerBusinessRelatedRoutes(Router $router): void {
    $router->get('/api/business/related', function($params) {
        try {
            $category = trim($_GET['category'] ?? '');
            $city = trim($_GET['city'] ?? '');
            $excludeSlug = trim($_GET['excludeSlug'] ?? '');

            if (!$category || !$city) Response::error('category and city are required', 400);

            $pdo = db();
            $sql = "SELECT id, name, slug, category, city, logo_url, description FROM businesses WHERE category = ? AND city = ? AND status = 'approved'";
            $bindParams = [$category, $city];

            if ($excludeSlug) {
                $sql .= " AND slug != ?";
                $bindParams[] = $excludeSlug;
            }
            $sql .= " ORDER BY created_at DESC LIMIT 2";

            $stmt = $pdo->prepare($sql);
            $stmt->execute($bindParams);
            $businesses = $stmt->fetchAll();

            $serialized = array_map(function($b) {
                return [
                    'id' => (string)$b['id'],
                    'name' => $b['name'],
                    'slug' => $b['slug'],
                    'category' => $b['category'],
                    'city' => $b['city'],
                    'logoUrl' => $b['logo_url'],
                    'description' => $b['description'],
                ];
            }, $businesses);

            Response::cached(['businesses' => $serialized], 's-maxage=3600, stale-while-revalidate=86400');
        } catch (Exception $e) {
            Logger::error('Error fetching related businesses:', $e->getMessage());
            Response::error('Failed to fetch related businesses', 500);
        }
    });
}
