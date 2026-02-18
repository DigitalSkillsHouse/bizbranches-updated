-- BizBranches MySQL Database Schema
-- Run this to create all tables from scratch

CREATE DATABASE IF NOT EXISTS bizbranches CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bizbranches;

-- Businesses table
CREATE TABLE IF NOT EXISTS businesses (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    sub_category VARCHAR(100) DEFAULT NULL,
    country VARCHAR(100) NOT NULL,
    province VARCHAR(100) DEFAULT NULL,
    city VARCHAR(100) NOT NULL,
    area VARCHAR(100) DEFAULT NULL,
    postal_code VARCHAR(12) DEFAULT NULL,
    address VARCHAR(500) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    phone_digits VARCHAR(20) DEFAULT NULL,
    contact_person VARCHAR(100) DEFAULT NULL,
    whatsapp VARCHAR(20) DEFAULT NULL,
    email VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    website_url VARCHAR(500) DEFAULT NULL,
    website_normalized VARCHAR(500) DEFAULT NULL,
    facebook_url VARCHAR(500) DEFAULT NULL,
    gmb_url VARCHAR(500) DEFAULT NULL,
    youtube_url VARCHAR(500) DEFAULT NULL,
    profile_username VARCHAR(100) DEFAULT NULL,
    swift_code VARCHAR(20) DEFAULT NULL,
    branch_code VARCHAR(20) DEFAULT NULL,
    city_dialing_code VARCHAR(10) DEFAULT NULL,
    iban VARCHAR(50) DEFAULT NULL,
    logo_url VARCHAR(500) DEFAULT NULL,
    logo_public_id VARCHAR(200) DEFAULT NULL,
    status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved',
    approved_at DATETIME DEFAULT NULL,
    approved_by ENUM('auto','admin') DEFAULT NULL,
    featured TINYINT(1) NOT NULL DEFAULT 0,
    featured_at DATETIME DEFAULT NULL,
    rating_avg DECIMAL(3,2) DEFAULT 0.00,
    rating_count INT UNSIGNED DEFAULT 0,
    latitude DECIMAL(10,7) DEFAULT NULL,
    longitude DECIMAL(10,7) DEFAULT NULL,
    location_verified TINYINT(1) NOT NULL DEFAULT 0,
    source VARCHAR(20) DEFAULT NULL,
    created_by VARCHAR(50) DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_slug (slug),
    INDEX idx_category_city (category, city),
    INDEX idx_status (status),
    INDEX idx_featured (featured, featured_at),
    INDEX idx_created_at (created_at),
    INDEX idx_email (email),
    INDEX idx_phone_digits (phone_digits),
    INDEX idx_website_normalized (website_normalized),
    INDEX idx_location_verified (location_verified),
    FULLTEXT INDEX ft_search (name, description, category, city, area)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    icon VARCHAR(50) DEFAULT NULL,
    description TEXT DEFAULT NULL,
    image_url VARCHAR(500) DEFAULT NULL,
    image_public_id VARCHAR(200) DEFAULT NULL,
    count INT UNSIGNED DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_slug (slug),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subcategories table (normalized from MongoDB nested array)
CREATE TABLE IF NOT EXISTS subcategories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id INT UNSIGNED NOT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    INDEX idx_category_id (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cities table
CREATE TABLE IF NOT EXISTS cities (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    province VARCHAR(100) DEFAULT NULL,
    country VARCHAR(100) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_slug (slug),
    INDEX idx_is_active (is_active),
    INDEX idx_country (country)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    business_id INT UNSIGNED NOT NULL,
    name VARCHAR(100) NOT NULL,
    rating TINYINT UNSIGNED NOT NULL,
    comment TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    INDEX idx_business_created (business_id, created_at),
    INDEX idx_business_rating (business_id, rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users / Profiles table
CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    handle VARCHAR(100) DEFAULT NULL,
    name VARCHAR(200) DEFAULT NULL,
    full_name VARCHAR(200) DEFAULT NULL,
    display_name VARCHAR(200) DEFAULT NULL,
    title VARCHAR(200) DEFAULT NULL,
    headline VARCHAR(300) DEFAULT NULL,
    role VARCHAR(100) DEFAULT NULL,
    avatar_url VARCHAR(500) DEFAULT NULL,
    photo_url VARCHAR(500) DEFAULT NULL,
    image_url VARCHAR(500) DEFAULT NULL,
    picture VARCHAR(500) DEFAULT NULL,
    email VARCHAR(255) DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_username (username),
    INDEX idx_handle (handle),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rate limiting table (replaces in-memory store)
CREATE TABLE IF NOT EXISTS rate_limits (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    route_path VARCHAR(100) NOT NULL DEFAULT 'global',
    request_count INT UNSIGNED NOT NULL DEFAULT 1,
    window_start DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ip_path (ip_address, route_path),
    INDEX idx_window (window_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default categories
INSERT IGNORE INTO categories (name, slug, icon, description, count, is_active) VALUES
('Restaurants', 'restaurants', '🍽️', 'Dining and food services', 0, 1),
('Healthcare', 'healthcare', '🏥', 'Medical and health services', 0, 1),
('Education', 'education', '🏫', 'Educational institutions and services', 0, 1),
('Automotive', 'automotive', '🚗', 'Automotive repair and services', 0, 1),
('Beauty & Salon', 'beauty-salon', '✂️', 'Beauty and salon services', 0, 1),
('Shopping', 'shopping', '🛍️', 'Retail and shopping centers', 0, 1);

-- Default subcategories
INSERT IGNORE INTO subcategories (category_id, name, slug) VALUES
((SELECT id FROM categories WHERE slug='beauty-salon'), 'Hair Care', 'hair-care'),
((SELECT id FROM categories WHERE slug='beauty-salon'), 'Makeup', 'makeup'),
((SELECT id FROM categories WHERE slug='beauty-salon'), 'Skin Care', 'skin-care'),
((SELECT id FROM categories WHERE slug='beauty-salon'), 'Nail Salon', 'nail-salon'),
((SELECT id FROM categories WHERE slug='beauty-salon'), 'Spa', 'spa'),
((SELECT id FROM categories WHERE slug='automotive'), 'Car Repair', 'car-repair'),
((SELECT id FROM categories WHERE slug='automotive'), 'Car Wash', 'car-wash'),
((SELECT id FROM categories WHERE slug='automotive'), 'Tyres & Wheels', 'tyres-wheels'),
((SELECT id FROM categories WHERE slug='automotive'), 'Car Accessories', 'car-accessories'),
((SELECT id FROM categories WHERE slug='automotive'), 'Showroom', 'showroom'),
((SELECT id FROM categories WHERE slug='restaurants'), 'Fast Food', 'fast-food'),
((SELECT id FROM categories WHERE slug='restaurants'), 'BBQ', 'bbq'),
((SELECT id FROM categories WHERE slug='restaurants'), 'Pakistani', 'pakistani'),
((SELECT id FROM categories WHERE slug='restaurants'), 'Chinese', 'chinese'),
((SELECT id FROM categories WHERE slug='restaurants'), 'Cafe', 'cafe'),
((SELECT id FROM categories WHERE slug='healthcare'), 'Clinic', 'clinic'),
((SELECT id FROM categories WHERE slug='healthcare'), 'Hospital', 'hospital'),
((SELECT id FROM categories WHERE slug='healthcare'), 'Pharmacy', 'pharmacy'),
((SELECT id FROM categories WHERE slug='healthcare'), 'Dentist', 'dentist'),
((SELECT id FROM categories WHERE slug='healthcare'), 'Laboratory', 'laboratory'),
((SELECT id FROM categories WHERE slug='education'), 'School', 'school'),
((SELECT id FROM categories WHERE slug='education'), 'College', 'college'),
((SELECT id FROM categories WHERE slug='education'), 'University', 'university'),
((SELECT id FROM categories WHERE slug='education'), 'Coaching', 'coaching'),
((SELECT id FROM categories WHERE slug='education'), 'Training Center', 'training-center'),
((SELECT id FROM categories WHERE slug='shopping'), 'Clothing', 'clothing'),
((SELECT id FROM categories WHERE slug='shopping'), 'Electronics', 'electronics'),
((SELECT id FROM categories WHERE slug='shopping'), 'Groceries', 'groceries'),
((SELECT id FROM categories WHERE slug='shopping'), 'Footwear', 'footwear'),
((SELECT id FROM categories WHERE slug='shopping'), 'Jewelry', 'jewelry');

-- Default cities
INSERT IGNORE INTO cities (name, slug, province, country, is_active) VALUES
('New York', 'new-york', 'New York', 'United States', 1),
('Los Angeles', 'los-angeles', 'California', 'United States', 1),
('London', 'london', 'England', 'United Kingdom', 1),
('Toronto', 'toronto', 'Ontario', 'Canada', 1),
('Sydney', 'sydney', 'New South Wales', 'Australia', 1),
('Berlin', 'berlin', 'Berlin', 'Germany', 1),
('Paris', 'paris', 'Île-de-France', 'France', 1),
('Mumbai', 'mumbai', 'Maharashtra', 'India', 1),
('Dubai', 'dubai', 'Dubai', 'UAE', 1),
('Karachi', 'karachi', 'Sindh', 'Pakistan', 1),
('Lahore', 'lahore', 'Punjab', 'Pakistan', 1),
('Islamabad', 'islamabad', 'Federal Capital', 'Pakistan', 1),
('Rawalpindi', 'rawalpindi', 'Punjab', 'Pakistan', 1),
('Faisalabad', 'faisalabad', 'Punjab', 'Pakistan', 1),
('Multan', 'multan', 'Punjab', 'Pakistan', 1);
