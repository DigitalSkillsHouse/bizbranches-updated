<?php
/**
 * Web-accessible migration runner for cPanel.
 * 
 * Visit: https://api.bizbranches.pk/run-migration.php?secret=YOUR_ADMIN_SECRET
 * 
 * This will:
 *   1. Create tables (if not exist)
 *   2. Import data from MongoDB JSON exports
 * 
 * DELETE THIS FILE after migration is complete!
 */

require_once __DIR__ . '/config/config.php';

header('Content-Type: text/plain; charset=utf-8');

$secret = $_GET['secret'] ?? '';
$adminSecret = env('ADMIN_SECRET', '');

if (!$adminSecret || $secret !== $adminSecret) {
    http_response_code(403);
    echo "Forbidden. Usage: ?secret=YOUR_ADMIN_SECRET\n";
    exit;
}

echo "=== Starting Migration ===\n\n";

// Step 1: Create tables
echo "--- Step 1: Creating tables ---\n";
$sqlFile = __DIR__ . '/migrations/001_create_tables.sql';
if (file_exists($sqlFile)) {
    try {
        require_once __DIR__ . '/config/database.php';
        $pdo = db();
        
        $sql = file_get_contents($sqlFile);
        // Remove CREATE DATABASE and USE statements (we're already connected to the right DB)
        $sql = preg_replace('/CREATE DATABASE.*?;\s*/i', '', $sql);
        $sql = preg_replace('/USE\s+\w+;\s*/i', '', $sql);
        
        $pdo->exec($sql);
        echo "Tables created successfully.\n\n";
    } catch (Exception $e) {
        echo "Table creation error (may already exist): " . $e->getMessage() . "\n\n";
    }
} else {
    echo "SQL file not found!\n\n";
}

// Step 2: Run MongoDB import
echo "--- Step 2: Importing MongoDB data ---\n";
ob_start();
include __DIR__ . '/scripts/migrate_from_mongodb.php';
$output = ob_get_clean();
echo $output;

echo "\n\n=== Migration Complete ===\n";
echo "IMPORTANT: Delete run-migration.php from your server now!\n";
