<?php
/**
 * MongoDB → MySQL Migration Script
 * 
 * Exports data from MongoDB and imports it into MySQL.
 * 
 * Usage:
 *   1. First export your MongoDB data to JSON:
 *      mongoexport --uri="YOUR_MONGODB_URI" --db=BizBranches --collection=businesses --out=businesses.json --jsonArray
 *      mongoexport --uri="YOUR_MONGODB_URI" --db=BizBranches --collection=categories --out=categories.json --jsonArray
 *      mongoexport --uri="YOUR_MONGODB_URI" --db=BizBranches --collection=cities --out=cities.json --jsonArray
 *      mongoexport --uri="YOUR_MONGODB_URI" --db=BizBranches --collection=reviews --out=reviews.json --jsonArray
 *      mongoexport --uri="YOUR_MONGODB_URI" --db=BizBranches --collection=users --out=users.json --jsonArray
 * 
 *   2. Place the JSON files in this scripts/ directory
 * 
 *   3. Run: php migrate_from_mongodb.php
 * 
 * Prerequisites:
 *   - MySQL database created (run migrations/001_create_tables.sql first)
 *   - .env file configured with DB_HOST, DB_NAME, DB_USER, DB_PASS
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/Logger.php';

echo "=== BizBranches MongoDB → MySQL Migration ===\n\n";

$pdo = db();
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$scriptDir = __DIR__;
$stats = ['categories' => 0, 'subcategories' => 0, 'cities' => 0, 'businesses' => 0, 'reviews' => 0, 'users' => 0, 'errors' => 0];

// ─── CATEGORIES ────────────────────────────────────────────────
$catFile = "$scriptDir/categories.json";
if (file_exists($catFile)) {
    echo "Importing categories...\n";
    $categories = json_decode(file_get_contents($catFile), true);
    if (!$categories) {
        echo "  ERROR: Could not parse categories.json\n";
    } else {
        $catIdMap = [];
        $stmt = $pdo->prepare("INSERT INTO categories (name, slug, icon, description, image_url, image_public_id, count, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), icon=VALUES(icon), description=VALUES(description), count=VALUES(count)");

        foreach ($categories as $cat) {
            try {
                $slug = $cat['slug'] ?? toSlugMigrate($cat['name'] ?? '');
                $createdAt = parseMongoDate($cat['createdAt'] ?? null);
                $stmt->execute([
                    $cat['name'] ?? '',
                    $slug,
                    $cat['icon'] ?? null,
                    $cat['description'] ?? null,
                    $cat['imageUrl'] ?? null,
                    $cat['imagePublicId'] ?? null,
                    (int)($cat['count'] ?? 0),
                    isset($cat['isActive']) ? (int)$cat['isActive'] : 1,
                    $createdAt,
                ]);
                $catIdMap[$slug] = $pdo->lastInsertId() ?: getCategoryIdBySlug($pdo, $slug);
                $stats['categories']++;

                if (!empty($cat['subcategories']) && is_array($cat['subcategories'])) {
                    $subStmt = $pdo->prepare("INSERT IGNORE INTO subcategories (category_id, name, slug) VALUES (?, ?, ?)");
                    foreach ($cat['subcategories'] as $sub) {
                        $catId = $catIdMap[$slug] ?? getCategoryIdBySlug($pdo, $slug);
                        if ($catId) {
                            $subStmt->execute([$catId, $sub['name'], $sub['slug']]);
                            $stats['subcategories']++;
                        }
                    }
                }
            } catch (Exception $e) {
                echo "  ERROR category '{$cat['name']}': {$e->getMessage()}\n";
                $stats['errors']++;
            }
        }
        echo "  Imported {$stats['categories']} categories, {$stats['subcategories']} subcategories\n";
    }
} else {
    echo "Skipping categories (no categories.json found)\n";
}

// ─── CITIES ────────────────────────────────────────────────────
$cityFile = "$scriptDir/cities.json";
if (file_exists($cityFile)) {
    echo "Importing cities...\n";
    $cities = json_decode(file_get_contents($cityFile), true);
    if (!$cities) {
        echo "  ERROR: Could not parse cities.json\n";
    } else {
        $stmt = $pdo->prepare("INSERT INTO cities (name, slug, province, country, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), province=VALUES(province), country=VALUES(country)");

        foreach ($cities as $city) {
            try {
                $slug = $city['slug'] ?? toSlugMigrate($city['name'] ?? '');
                $createdAt = parseMongoDate($city['createdAt'] ?? null);
                $stmt->execute([
                    $city['name'] ?? '',
                    $slug,
                    $city['province'] ?? null,
                    $city['country'] ?? 'Pakistan',
                    isset($city['isActive']) ? (int)$city['isActive'] : 1,
                    $createdAt,
                ]);
                $stats['cities']++;
            } catch (Exception $e) {
                echo "  ERROR city '{$city['name']}': {$e->getMessage()}\n";
                $stats['errors']++;
            }
        }
        echo "  Imported {$stats['cities']} cities\n";
    }
} else {
    echo "Skipping cities (no cities.json found)\n";
}

// ─── BUSINESSES ────────────────────────────────────────────────
$bizFile = "$scriptDir/businesses.json";
if (file_exists($bizFile)) {
    echo "Importing businesses...\n";
    $businesses = json_decode(file_get_contents($bizFile), true);
    if (!$businesses) {
        echo "  ERROR: Could not parse businesses.json\n";
    } else {
        $mongoIdMap = [];

        $stmt = $pdo->prepare("INSERT INTO businesses (
            name, slug, category, sub_category, country, province, city, area, postal_code,
            address, phone, phone_digits, contact_person, whatsapp, email, description,
            website_url, website_normalized, facebook_url, gmb_url, youtube_url,
            profile_username, swift_code, branch_code, city_dialing_code, iban,
            logo_url, logo_public_id, status, approved_at, approved_by,
            featured, featured_at, rating_avg, rating_count,
            latitude, longitude, location_verified, source, created_by, created_at, updated_at
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ON DUPLICATE KEY UPDATE name=VALUES(name), status=VALUES(status), updated_at=VALUES(updated_at)");

        foreach ($businesses as $biz) {
            try {
                $mongoId = extractMongoId($biz['_id'] ?? null);
                $slug = $biz['slug'] ?? toSlugMigrate($biz['name'] ?? '');
                $createdAt = parseMongoDate($biz['createdAt'] ?? null);
                $updatedAt = parseMongoDate($biz['updatedAt'] ?? null);
                $approvedAt = parseMongoDate($biz['approvedAt'] ?? null);
                $featuredAt = parseMongoDate($biz['featuredAt'] ?? null);

                $lat = isset($biz['latitude']) ? (float)$biz['latitude'] : null;
                $lng = isset($biz['longitude']) ? (float)$biz['longitude'] : null;

                if (($lat === null || $lng === null) && isset($biz['location']['coordinates'])) {
                    $lng = (float)$biz['location']['coordinates'][0];
                    $lat = (float)$biz['location']['coordinates'][1];
                }

                $stmt->execute([
                    $biz['name'] ?? '',
                    $slug,
                    $biz['category'] ?? '',
                    $biz['subCategory'] ?? $biz['subcategory'] ?? null,
                    $biz['country'] ?? '',
                    $biz['province'] ?? null,
                    $biz['city'] ?? '',
                    $biz['area'] ?? null,
                    $biz['postalCode'] ?? null,
                    $biz['address'] ?? '',
                    $biz['phone'] ?? '',
                    $biz['phoneDigits'] ?? preg_replace('/\D/', '', $biz['phone'] ?? ''),
                    $biz['contactPerson'] ?? null,
                    $biz['whatsapp'] ?? null,
                    $biz['email'] ?? '',
                    $biz['description'] ?? '',
                    $biz['websiteUrl'] ?? null,
                    $biz['websiteNormalized'] ?? null,
                    $biz['facebookUrl'] ?? null,
                    $biz['gmbUrl'] ?? null,
                    $biz['youtubeUrl'] ?? null,
                    $biz['profileUsername'] ?? null,
                    $biz['swiftCode'] ?? null,
                    $biz['branchCode'] ?? null,
                    $biz['cityDialingCode'] ?? null,
                    $biz['iban'] ?? null,
                    $biz['logoUrl'] ?? null,
                    $biz['logoPublicId'] ?? null,
                    $biz['status'] ?? 'approved',
                    $approvedAt,
                    $biz['approvedBy'] ?? null,
                    (int)($biz['featured'] ?? 0),
                    $featuredAt,
                    (float)($biz['ratingAvg'] ?? 0),
                    (int)($biz['ratingCount'] ?? 0),
                    $lat,
                    $lng,
                    (int)($biz['locationVerified'] ?? 0),
                    $biz['source'] ?? null,
                    $biz['createdBy'] ?? null,
                    $createdAt,
                    $updatedAt,
                ]);

                $insertedId = $pdo->lastInsertId();
                if ($mongoId && $insertedId) {
                    $mongoIdMap[$mongoId] = $insertedId;
                } elseif ($mongoId) {
                    $lookupStmt = $pdo->prepare("SELECT id FROM businesses WHERE slug = ?");
                    $lookupStmt->execute([$slug]);
                    $found = $lookupStmt->fetchColumn();
                    if ($found) $mongoIdMap[$mongoId] = $found;
                }

                $stats['businesses']++;
                if ($stats['businesses'] % 100 === 0) {
                    echo "  ... {$stats['businesses']} businesses imported\n";
                }
            } catch (Exception $e) {
                echo "  ERROR business '{$biz['name']}': {$e->getMessage()}\n";
                $stats['errors']++;
            }
        }
        echo "  Imported {$stats['businesses']} businesses\n";

        file_put_contents("$scriptDir/mongo_id_map.json", json_encode($mongoIdMap, JSON_PRETTY_PRINT));
        echo "  Saved MongoDB→MySQL ID mapping to mongo_id_map.json\n";
    }
} else {
    echo "Skipping businesses (no businesses.json found)\n";
}

// ─── REVIEWS ───────────────────────────────────────────────────
$reviewFile = "$scriptDir/reviews.json";
if (file_exists($reviewFile)) {
    echo "Importing reviews...\n";

    if (empty($mongoIdMap) && file_exists("$scriptDir/mongo_id_map.json")) {
        $mongoIdMap = json_decode(file_get_contents("$scriptDir/mongo_id_map.json"), true) ?? [];
    }

    $reviews = json_decode(file_get_contents($reviewFile), true);
    if (!$reviews) {
        echo "  ERROR: Could not parse reviews.json\n";
    } else {
        $stmt = $pdo->prepare("INSERT INTO reviews (business_id, name, rating, comment, created_at) VALUES (?, ?, ?, ?, ?)");
        $skipped = 0;

        foreach ($reviews as $rev) {
            try {
                $mongoBusinessId = $rev['businessId'] ?? '';
                $mysqlBusinessId = $mongoIdMap[$mongoBusinessId] ?? null;

                if (!$mysqlBusinessId) {
                    $lookupStmt = $pdo->prepare("SELECT id FROM businesses WHERE slug = ? LIMIT 1");
                    $lookupStmt->execute([$mongoBusinessId]);
                    $mysqlBusinessId = $lookupStmt->fetchColumn();
                }

                if (!$mysqlBusinessId) {
                    $skipped++;
                    continue;
                }

                $createdAt = parseMongoDate($rev['createdAt'] ?? null);
                $stmt->execute([
                    (int)$mysqlBusinessId,
                    $rev['name'] ?? 'Anonymous',
                    min(5, max(1, (int)($rev['rating'] ?? 5))),
                    $rev['comment'] ?? '',
                    $createdAt,
                ]);
                $stats['reviews']++;
            } catch (Exception $e) {
                echo "  ERROR review: {$e->getMessage()}\n";
                $stats['errors']++;
            }
        }
        echo "  Imported {$stats['reviews']} reviews (skipped $skipped with unknown business)\n";
    }
} else {
    echo "Skipping reviews (no reviews.json found)\n";
}

// ─── USERS ─────────────────────────────────────────────────────
$userFile = "$scriptDir/users.json";
if (file_exists($userFile)) {
    echo "Importing users...\n";
    $users = json_decode(file_get_contents($userFile), true);
    if (!$users) {
        echo "  ERROR: Could not parse users.json\n";
    } else {
        $stmt = $pdo->prepare("INSERT INTO users (username, handle, name, full_name, display_name, title, headline, role, avatar_url, photo_url, image_url, picture, email, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name), title=VALUES(title)");

        foreach ($users as $user) {
            try {
                $createdAt = parseMongoDate($user['createdAt'] ?? null);
                $stmt->execute([
                    $user['username'] ?? $user['handle'] ?? ('user_' . $stats['users']),
                    $user['handle'] ?? null,
                    $user['name'] ?? null,
                    $user['fullName'] ?? null,
                    $user['displayName'] ?? null,
                    $user['title'] ?? null,
                    $user['headline'] ?? null,
                    $user['role'] ?? null,
                    $user['avatarUrl'] ?? null,
                    $user['photoUrl'] ?? null,
                    $user['imageUrl'] ?? null,
                    $user['picture'] ?? null,
                    $user['email'] ?? null,
                    $createdAt,
                ]);
                $stats['users']++;
            } catch (Exception $e) {
                echo "  ERROR user '{$user['username']}': {$e->getMessage()}\n";
                $stats['errors']++;
            }
        }
        echo "  Imported {$stats['users']} users\n";
    }
} else {
    echo "Skipping users (no users.json found)\n";
}

// ─── RECALCULATE CATEGORY COUNTS ──────────────────────────────
echo "Recalculating category business counts...\n";
try {
    $pdo->exec("UPDATE categories c SET c.count = (SELECT COUNT(*) FROM businesses b WHERE LOWER(b.category) = LOWER(c.name) AND b.status = 'approved')");
    echo "  Done\n";
} catch (Exception $e) {
    echo "  ERROR: {$e->getMessage()}\n";
}

// ─── RECALCULATE REVIEW AGGREGATES ────────────────────────────
echo "Recalculating business rating aggregates...\n";
try {
    $pdo->exec("UPDATE businesses b SET 
        b.rating_avg = COALESCE((SELECT ROUND(AVG(r.rating), 2) FROM reviews r WHERE r.business_id = b.id), 0),
        b.rating_count = COALESCE((SELECT COUNT(*) FROM reviews r WHERE r.business_id = b.id), 0)
    ");
    echo "  Done\n";
} catch (Exception $e) {
    echo "  ERROR: {$e->getMessage()}\n";
}

// Expose stats when included from API (e.g. admin import)
$GLOBALS['migration_stats'] = $stats;

// ─── SUMMARY ──────────────────────────────────────────────────
if (!defined('MIGRATION_SILENT')) {
echo "\n=== Migration Complete ===\n";
echo "Categories:    {$stats['categories']}\n";
echo "Subcategories: {$stats['subcategories']}\n";
echo "Cities:        {$stats['cities']}\n";
echo "Businesses:    {$stats['businesses']}\n";
echo "Reviews:       {$stats['reviews']}\n";
echo "Users:         {$stats['users']}\n";
echo "Errors:        {$stats['errors']}\n";
}

// ─── Helper functions ─────────────────────────────────────────

function parseMongoDate($val): string {
    if (!$val) return date('Y-m-d H:i:s');
    if (is_string($val)) {
        $ts = strtotime($val);
        return $ts ? date('Y-m-d H:i:s', $ts) : date('Y-m-d H:i:s');
    }
    if (is_array($val) && isset($val['$date'])) {
        $d = $val['$date'];
        if (is_string($d)) return date('Y-m-d H:i:s', strtotime($d));
        if (is_array($d) && isset($d['$numberLong'])) return date('Y-m-d H:i:s', (int)($d['$numberLong'] / 1000));
    }
    return date('Y-m-d H:i:s');
}

function extractMongoId($val): ?string {
    if (!$val) return null;
    if (is_string($val)) return $val;
    if (is_array($val) && isset($val['$oid'])) return $val['$oid'];
    return null;
}

function toSlugMigrate(string $s): string {
    return substr(preg_replace('/-+/', '-', preg_replace('/[^a-z0-9\s-]/', '', preg_replace('/\s+/', '-', strtolower(trim($s))))), 0, 140);
}

function getCategoryIdBySlug(PDO $pdo, string $slug): ?int {
    $stmt = $pdo->prepare("SELECT id FROM categories WHERE slug = ?");
    $stmt->execute([$slug]);
    $id = $stmt->fetchColumn();
    return $id ? (int)$id : null;
}
