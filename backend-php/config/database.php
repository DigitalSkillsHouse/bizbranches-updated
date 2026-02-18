<?php

require_once __DIR__ . '/config.php';

class Database {
    private static ?PDO $instance = null;

    public static function getConnection(): PDO {
        if (self::$instance === null) {
            $host = env('DB_HOST', '127.0.0.1');
            $port = env('DB_PORT', '3306');
            $name = env('DB_NAME', env('MYSQL_DATABASE', 'bizbranches'));
            $user = env('DB_USER', env('MYSQL_USER', 'root'));
            $pass = env('DB_PASS', env('MYSQL_PASSWORD', ''));
            $charset = 'utf8mb4';

            $dsn = "mysql:host=$host;port=$port;dbname=$name;charset=$charset";
            
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_PERSISTENT => true,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
            ];

            self::$instance = new PDO($dsn, $user, $pass, $options);
        }
        return self::$instance;
    }

    public static function close(): void {
        self::$instance = null;
    }
}

function db(): PDO {
    return Database::getConnection();
}
