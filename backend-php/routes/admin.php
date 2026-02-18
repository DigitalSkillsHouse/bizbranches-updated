<?php

function registerAdminRoutes(Router $router): void {
    // POST /api/admin/import-mongodb — upload JSON files and import into MySQL
    $router->post('/api/admin/import-mongodb', function($params) {
        $adminSecret = env('ADMIN_SECRET');
        if (!$adminSecret) Response::error('Missing ADMIN_SECRET', 500);

        $headerSecret = $_SERVER['HTTP_X_ADMIN_SECRET'] ?? '';
        if (empty($headerSecret) && isset($_POST['admin_secret'])) $headerSecret = (string)$_POST['admin_secret'];
        if ($headerSecret !== $adminSecret) Response::error('Unauthorized', 401);

        $scriptDir = __DIR__ . '/../scripts';
        $allowed = ['categories' => 'categories.json', 'cities' => 'cities.json', 'businesses' => 'businesses.json', 'reviews' => 'reviews.json', 'users' => 'users.json'];
        $saved = [];

        foreach ($allowed as $key => $filename) {
            if (empty($_FILES[$key]['tmp_name']) || !is_uploaded_file($_FILES[$key]['tmp_name'])) continue;
            $path = $scriptDir . '/' . $filename;
            if (move_uploaded_file($_FILES[$key]['tmp_name'], $path)) $saved[] = $filename;
        }

        if (empty($saved)) {
            Response::error('No valid JSON files uploaded. Use form fields: categories, cities, businesses, reviews, users.', 400);
        }

        define('MIGRATION_SILENT', true);
        ob_start();
        try {
            require_once $scriptDir . '/migrate_from_mongodb.php';
        } catch (Throwable $e) {
            ob_end_clean();
            Logger::error('Import error:', $e->getMessage());
            Response::error('Import failed: ' . $e->getMessage(), 500);
        }
        ob_end_clean();
        $stats = $GLOBALS['migration_stats'] ?? [];

        Response::success([
            'message' => 'Import completed',
            'files_saved' => $saved,
            'stats' => $stats,
        ]);
    });

    $router->get('/api/admin/submissions', function($params) {
        $adminSecret = env('ADMIN_SECRET');
        if (!$adminSecret) Response::error('Missing ADMIN_SECRET', 500);

        $bearer = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        $headerSecret = $_SERVER['HTTP_X_ADMIN_SECRET'] ?? '';
        if (!$headerSecret && str_starts_with($bearer, 'Bearer ')) $headerSecret = substr($bearer, 7);
        if ($headerSecret !== $adminSecret) Response::error('Unauthorized', 401);

        $ip = RateLimit::getClientIp();
        $rl = RateLimit::check($ip, 'admin-submissions', 60);
        if (!$rl['ok']) Response::error('Too many requests', 429);

        try {
            $pdo = db();
            $page = max(1, (int)($_GET['page'] ?? 1));
            $limit = min((int)($_GET['limit'] ?? 20), 100);
            $offset = ($page - 1) * $limit;

            $where = "approved_by = 'auto'";
            $bindParams = [];

            if (!empty($_GET['from'])) {
                $where .= " AND created_at >= ?";
                $bindParams[] = $_GET['from'];
            }
            if (!empty($_GET['to'])) {
                $where .= " AND created_at <= ?";
                $bindParams[] = $_GET['to'];
            }

            $countStmt = $pdo->prepare("SELECT COUNT(*) FROM businesses WHERE $where");
            $countStmt->execute($bindParams);
            $total = (int)$countStmt->fetchColumn();

            $stmt = $pdo->prepare("SELECT * FROM businesses WHERE $where ORDER BY created_at DESC LIMIT ? OFFSET ?");
            $stmt->execute([...$bindParams, $limit, $offset]);
            $businesses = enrichBusinessList($stmt->fetchAll());

            Response::success([
                'businesses' => $businesses,
                'pagination' => ['page' => $page, 'limit' => $limit, 'total' => $total, 'pages' => (int)ceil($total / $limit)]
            ]);
        } catch (Exception $e) {
            Logger::error('Error fetching admin submissions:', $e->getMessage());
            Response::error('Failed to fetch submissions', 500);
        }
    });
}
