<?php

function registerDebugRoutes(Router $router): void {
    if (isProd()) return;

    $router->get('/api/debug', function($params) {
        try {
            $pdo = db();
            $counts = [];
            foreach (['businesses', 'categories', 'cities', 'reviews'] as $table) {
                $counts[$table] = (int)$pdo->query("SELECT COUNT(*) FROM $table")->fetchColumn();
            }
            Response::success(['counts' => $counts]);
        } catch (Exception $e) {
            Response::error($e->getMessage(), 500);
        }
    });
}
