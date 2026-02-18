<?php

function registerReviewsRoutes(Router $router): void {
    $router->get('/api/reviews', function($params) {
        try {
            $bizParam = trim($_GET['businessId'] ?? $_GET['business'] ?? '');
            if (!$bizParam) Response::error('businessId is required', 400);

            $pdo = db();
            $business = null;
            if (ctype_digit($bizParam)) {
                $stmt = $pdo->prepare("SELECT id FROM businesses WHERE id = ?");
                $stmt->execute([(int)$bizParam]);
                $business = $stmt->fetch();
            }
            if (!$business) {
                $stmt = $pdo->prepare("SELECT id FROM businesses WHERE slug = ?");
                $stmt->execute([$bizParam]);
                $business = $stmt->fetch();
            }
            if (!$business) Response::error('Business not found', 404);

            $businessId = (int)$business['id'];

            $reviewStmt = $pdo->prepare("SELECT name, rating, comment, created_at as createdAt FROM reviews WHERE business_id = ? ORDER BY created_at DESC LIMIT 200");
            $reviewStmt->execute([$businessId]);
            $reviews = $reviewStmt->fetchAll();

            $aggStmt = $pdo->prepare("SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE business_id = ?");
            $aggStmt->execute([$businessId]);
            $agg = $aggStmt->fetch();
            $ratingAvg = round((float)($agg['avg_rating'] ?? 0), 2);
            $ratingCount = (int)($agg['count'] ?? 0);

            // Sync back to business (best effort)
            try {
                $pdo->prepare("UPDATE businesses SET rating_avg = ?, rating_count = ?, updated_at = NOW() WHERE id = ?")->execute([$ratingAvg, $ratingCount, $businessId]);
            } catch (Exception $e) {}

            Response::json(['ok' => true, 'reviews' => $reviews, 'ratingAvg' => $ratingAvg, 'ratingCount' => $ratingCount], 200, ['Cache-Control' => 'no-store']);
        } catch (Exception $e) {
            Logger::error('Error fetching reviews:', $e->getMessage());
            Response::error('Failed to fetch reviews. Please try again later.', 500);
        }
    });

    $router->post('/api/reviews', function($params) {
        $ip = RateLimit::getClientIp();
        $rl = RateLimit::check($ip, 'reviews-post', 20);
        if (!$rl['ok']) Response::error('Too many review submissions. Try again later.', 429);

        try {
            $pdo = db();
            $json = json_decode(file_get_contents('php://input'), true) ?? [];

            $candidate = [
                'businessId' => trim($json['businessId'] ?? $json['business'] ?? ''),
                'name' => trim($json['name'] ?? ''),
                'rating' => (int)($json['rating'] ?? 0),
                'comment' => trim($json['comment'] ?? ''),
            ];

            // Resolve business
            $business = null;
            if (ctype_digit($candidate['businessId'])) {
                $stmt = $pdo->prepare("SELECT id, rating_avg, rating_count FROM businesses WHERE id = ?");
                $stmt->execute([(int)$candidate['businessId']]);
                $business = $stmt->fetch();
            }
            if (!$business && $candidate['businessId']) {
                $stmt = $pdo->prepare("SELECT id, rating_avg, rating_count FROM businesses WHERE slug = ?");
                $stmt->execute([$candidate['businessId']]);
                $business = $stmt->fetch();
            }
            if (!$business) Response::error('Business not found', 404);

            $errors = Validator::validateCreateReview([
                'businessId' => (string)$business['id'],
                'name' => $candidate['name'],
                'rating' => $candidate['rating'],
                'comment' => $candidate['comment'],
            ]);
            if (!empty($errors)) Response::error('Invalid review', 400, ['details' => $errors]);

            $pdo->prepare("INSERT INTO reviews (business_id, name, rating, comment) VALUES (?, ?, ?, ?)")
                ->execute([(int)$business['id'], $candidate['name'], $candidate['rating'], $candidate['comment']]);

            $prevAvg = (float)($business['rating_avg'] ?? 0);
            $prevCount = (int)($business['rating_count'] ?? 0);
            $newCount = $prevCount + 1;
            $newAvg = round(($prevAvg * $prevCount + $candidate['rating']) / $newCount, 2);

            $pdo->prepare("UPDATE businesses SET rating_avg = ?, rating_count = ?, updated_at = NOW() WHERE id = ?")
                ->execute([$newAvg, $newCount, (int)$business['id']]);

            Response::json(['ok' => true, 'ratingAvg' => $newAvg, 'ratingCount' => $newCount], 200, ['Cache-Control' => 'no-store']);
        } catch (Exception $e) {
            Logger::error('Error submitting review:', $e->getMessage());
            Response::error('Failed to submit review. Please try again later.', 500);
        }
    });
}
