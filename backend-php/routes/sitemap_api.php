<?php

function registerSitemapApiRoutes(Router $router): void {
    $router->get('/api/sitemap/businesses', function($params) {
        try {
            $pdo = db();
            $page = max(1, (int)($_GET['page'] ?? 1));
            $limit = min((int)($_GET['limit'] ?? 45000), 45000);
            $offset = ($page - 1) * $limit;

            $stmt = $pdo->prepare("SELECT slug, updated_at as updatedAt FROM businesses WHERE status = 'approved' ORDER BY created_at DESC LIMIT ? OFFSET ?");
            $stmt->execute([$limit, $offset]);
            $businesses = $stmt->fetchAll();

            $countStmt = $pdo->query("SELECT COUNT(*) FROM businesses WHERE status = 'approved'");
            $total = (int)$countStmt->fetchColumn();

            Response::cached([
                'businesses' => $businesses,
                'total' => $total,
                'page' => $page,
                'pages' => (int)ceil($total / $limit),
            ], 's-maxage=300, stale-while-revalidate=600');
        } catch (Exception $e) {
            Logger::error('Error fetching sitemap businesses:', $e->getMessage());
            Response::error('Failed to fetch sitemap data', 500);
        }
    });

    $router->get('/api/sitemap/geo-pages', function($params) {
        try {
            $pdo = db();

            $ccStmt = $pdo->query("SELECT DISTINCT CONCAT(LOWER(city), '/', LOWER(category)) as path FROM businesses WHERE status = 'approved' AND city != '' AND category != '' LIMIT 5000");
            $cityCategory = $ccStmt->fetchAll(PDO::FETCH_COLUMN);

            $ccaStmt = $pdo->query("SELECT DISTINCT CONCAT(LOWER(city), '/', LOWER(category), '/', LOWER(area)) as path FROM businesses WHERE status = 'approved' AND city != '' AND category != '' AND area IS NOT NULL AND area != '' LIMIT 10000");
            $cityCategoryArea = $ccaStmt->fetchAll(PDO::FETCH_COLUMN);

            Response::cached([
                'cityCategory' => $cityCategory,
                'cityCategoryArea' => $cityCategoryArea,
            ], 's-maxage=600, stale-while-revalidate=1200');
        } catch (Exception $e) {
            Logger::error('Error fetching sitemap geo pages:', $e->getMessage());
            Response::error('Failed to fetch sitemap data', 500);
        }
    });
}
