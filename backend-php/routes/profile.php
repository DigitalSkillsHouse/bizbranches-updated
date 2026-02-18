<?php

function registerProfileRoutes(Router $router): void {
    $router->get('/api/profile', function($params) {
        $username = trim($_GET['username'] ?? '');
        if (!$username) Response::error('username is required', 400);

        $pdo = db();

        $stmt = $pdo->prepare("SELECT * FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(handle) = LOWER(?) LIMIT 1");
        $stmt->execute([$username, $username]);
        $doc = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$doc) {
            Response::error('Profile not found', 404);
            return;
        }

        $name = $doc['name'] ?: $doc['full_name'] ?: $doc['display_name'] ?: $doc['title'] ?: '';
        $title = $doc['title'] ?: $doc['headline'] ?: $doc['role'] ?: '';
        $avatarUrl = $doc['avatar_url'] ?: $doc['photo_url'] ?: $doc['image_url'] ?: $doc['picture'] ?: '';

        Response::success(['profile' => [
            'username' => $username,
            'name' => $name,
            'title' => $title,
            'avatarUrl' => $avatarUrl,
        ]]);
    });
}
