<?php

function registerDbHealthRoutes(Router $router): void {
    $router->get('/api/db-health', function($params) {
        try {
            $pdo = db();
            $pdo->query("SELECT 1");
            $info = !isProd() ? ['server' => $pdo->getAttribute(PDO::ATTR_SERVER_VERSION)] : [];
            Response::success(array_merge(['ping' => 'ok'], $info));
        } catch (Exception $e) {
            Response::error('Database connection failed: ' . $e->getMessage(), 500);
        }
    });
}
