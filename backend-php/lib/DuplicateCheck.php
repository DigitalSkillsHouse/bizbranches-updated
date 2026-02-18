<?php

class DuplicateCheck {
    public static function normalizePhone(string $phone): string {
        return preg_replace('/\D/', '', $phone);
    }

    public static function normalizeEmail(string $email): string {
        return strtolower(trim($email));
    }

    public static function normalizeUrl(string $url): ?string {
        $u = strtolower(trim($url));
        if (empty($u)) return null;
        if (!preg_match('#^https?://#', $u)) $u = 'https://' . $u;
        $parsed = parse_url($u);
        if (!$parsed || !isset($parsed['host'])) return $u;
        $path = rtrim($parsed['path'] ?? '/', '/') ?: '/';
        $query = isset($parsed['query']) ? '?' . $parsed['query'] : '';
        return $parsed['host'] . $path . $query;
    }

    public static function getNormalizedForInsert(string $phone, ?string $websiteUrl = null): array {
        return [
            'phoneDigits' => self::normalizePhone($phone),
            'websiteNormalized' => $websiteUrl ? self::normalizeUrl($websiteUrl) : null,
        ];
    }

    public static function check(array $input): array {
        $conflicts = [];
        $pdo = db();

        $name = trim($input['name'] ?? '');
        $city = trim($input['city'] ?? '');
        $category = trim($input['category'] ?? '');
        $phoneNorm = self::normalizePhone($input['phone'] ?? '');
        $emailNorm = self::normalizeEmail($input['email'] ?? '');
        $websiteNorm = isset($input['websiteUrl']) ? self::normalizeUrl($input['websiteUrl']) : null;
        $facebookNorm = isset($input['facebookUrl']) ? self::normalizeUrl($input['facebookUrl']) : null;
        $gmbNorm = isset($input['gmbUrl']) ? self::normalizeUrl($input['gmbUrl']) : null;
        $youtubeNorm = isset($input['youtubeUrl']) ? self::normalizeUrl($input['youtubeUrl']) : null;
        $whatsappNorm = isset($input['whatsapp']) ? self::normalizePhone($input['whatsapp']) : '';
        $excludeId = $input['excludeId'] ?? null;

        $excludeClause = $excludeId ? ' AND id != ?' : '';
        $excludeParams = $excludeId ? [$excludeId] : [];

        if ($name && $city && $category) {
            $stmt = $pdo->prepare(
                "SELECT id FROM businesses WHERE LOWER(name) = LOWER(?) AND LOWER(city) = LOWER(?) AND LOWER(category) = LOWER(?)" . $excludeClause . " LIMIT 1"
            );
            $params = [$name, $city, $category, ...$excludeParams];
            $stmt->execute($params);
            if ($stmt->fetch()) $conflicts['nameCityCategory'] = true;
        }

        if (strlen($phoneNorm) >= 7) {
            $stmt = $pdo->prepare("SELECT id FROM businesses WHERE phone_digits = ?" . $excludeClause . " LIMIT 1");
            $stmt->execute([$phoneNorm, ...$excludeParams]);
            if ($stmt->fetch()) $conflicts['phone'] = true;
        }

        if (strlen($whatsappNorm) >= 7) {
            $stmt = $pdo->prepare("SELECT id FROM businesses WHERE REPLACE(REPLACE(REPLACE(whatsapp, ' ', ''), '-', ''), '+', '') LIKE ?" . $excludeClause . " LIMIT 1");
            $stmt->execute(['%' . $whatsappNorm . '%', ...$excludeParams]);
            if ($stmt->fetch()) $conflicts['whatsapp'] = true;
        }

        if ($emailNorm) {
            $stmt = $pdo->prepare("SELECT id FROM businesses WHERE LOWER(email) = ?" . $excludeClause . " LIMIT 1");
            $stmt->execute([$emailNorm, ...$excludeParams]);
            if ($stmt->fetch()) $conflicts['email'] = true;
        }

        if ($websiteNorm) {
            $stmt = $pdo->prepare("SELECT id FROM businesses WHERE website_normalized = ?" . $excludeClause . " LIMIT 1");
            $stmt->execute([$websiteNorm, ...$excludeParams]);
            if ($stmt->fetch()) $conflicts['websiteUrl'] = true;
        }

        if ($facebookNorm) {
            $stmt = $pdo->prepare("SELECT id FROM businesses WHERE LOWER(facebook_url) LIKE ?" . $excludeClause . " LIMIT 1");
            $stmt->execute(['%' . $facebookNorm . '%', ...$excludeParams]);
            if ($stmt->fetch()) $conflicts['facebookUrl'] = true;
        }

        if ($gmbNorm) {
            $stmt = $pdo->prepare("SELECT id FROM businesses WHERE LOWER(gmb_url) LIKE ?" . $excludeClause . " LIMIT 1");
            $stmt->execute(['%' . $gmbNorm . '%', ...$excludeParams]);
            if ($stmt->fetch()) $conflicts['gmbUrl'] = true;
        }

        if ($youtubeNorm) {
            $stmt = $pdo->prepare("SELECT id FROM businesses WHERE LOWER(youtube_url) LIKE ?" . $excludeClause . " LIMIT 1");
            $stmt->execute(['%' . $youtubeNorm . '%', ...$excludeParams]);
            if ($stmt->fetch()) $conflicts['youtubeUrl'] = true;
        }

        return $conflicts;
    }

    public static function hasAnyConflict(array $conflicts): bool {
        return !empty($conflicts);
    }
}
