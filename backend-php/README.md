# BizBranches PHP Backend

PHP + MySQL replacement for the original Node.js/Express/MongoDB backend.

## Prerequisites

- PHP 8.1+
- MySQL 8.0+
- Composer (PHP package manager)

## Setup

### 1. Install Dependencies

```bash
cd backend-php
composer install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your MySQL credentials and other settings
```

### 3. Create Database & Run Migrations

```sql
CREATE DATABASE bizbranches CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Then run the migration SQL:

```bash
mysql -u root -p bizbranches < migrations/001_create_tables.sql
```

### 4. Migrate Data from MongoDB (if applicable)

Export your MongoDB collections to JSON files:

```bash
mongoexport --uri="YOUR_MONGODB_URI" --db=BizBranches --collection=businesses --out=scripts/businesses.json --jsonArray
mongoexport --uri="YOUR_MONGODB_URI" --db=BizBranches --collection=categories --out=scripts/categories.json --jsonArray
mongoexport --uri="YOUR_MONGODB_URI" --db=BizBranches --collection=cities --out=scripts/cities.json --jsonArray
mongoexport --uri="YOUR_MONGODB_URI" --db=BizBranches --collection=reviews --out=scripts/reviews.json --jsonArray
```

Then run the migration script:

```bash
php scripts/migrate_from_mongodb.php
```

### 5. Start the Server

Development (standalone):

```bash
php -S 0.0.0.0:3002 index.php
```

With the frontend (from project root):

```bash
npm run dev:php
```

Production (from project root):

```bash
npm run start:php
```

## API Endpoints

All endpoints mirror the original Node.js backend API exactly.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ping` | Health check |
| GET | `/api/db-health` | Database connection check |
| GET | `/api/businesses` | List businesses (paginated, filtered) |
| GET | `/api/business/:slug` | Get business by slug |
| POST | `/api/businesses` | Create new business |
| POST | `/api/business/duplicate-check` | Check for duplicates |
| GET | `/api/categories` | List categories |
| GET | `/api/category/:slug` | Get category by slug |
| GET | `/api/search` | Autocomplete search |
| GET | `/api/cities` | List cities |
| GET | `/api/countries` | List countries |
| GET | `/api/reviews/:id` | Get reviews for business |
| POST | `/api/reviews` | Submit a review |
| GET | `/api/provinces` | List provinces |
| GET | `/api/areas` | List areas by city |
| GET | `/api/geocode` | Geocode an address |
| GET | `/api/business/related` | Related businesses |
| GET | `/api/admin/submissions` | Admin submissions list |

## Project Structure

```
backend-php/
├── config/
│   ├── config.php          # Environment & helpers
│   └── database.php        # PDO MySQL connection
├── lib/
│   ├── CloudinaryHelper.php
│   ├── Courier.php
│   ├── DuplicateCheck.php
│   ├── Email.php
│   ├── Geo.php
│   ├── Geocode.php
│   ├── GooglePing.php
│   ├── Logger.php
│   ├── RateLimit.php
│   ├── Response.php
│   ├── Router.php
│   ├── Sanitize.php
│   └── Validator.php
├── routes/
│   ├── admin.php
│   ├── areas.php
│   ├── business.php
│   ├── business_related.php
│   ├── categories.php
│   ├── cities.php
│   ├── db_health.php
│   ├── debug.php
│   ├── geocode.php
│   ├── profile.php
│   ├── provinces.php
│   ├── reviews.php
│   ├── search.php
│   └── sitemap_api.php
├── migrations/
│   └── 001_create_tables.sql
├── scripts/
│   └── migrate_from_mongodb.php
├── data/
│   └── pakistan-cities.json
├── index.php               # Entry point
├── composer.json
├── .env.example
└── .gitignore
```
