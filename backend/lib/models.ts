import { getDb } from './mongodb';
import { Collection, Db } from 'mongodb';
import { Business, Category, City, Review } from './schemas';
import { logger } from './logger';

// Database Models Class
class DatabaseModels {
    db: Db;
    constructor(db: Db) {
        this.db = db;
    }
    // Business Collection
    get businesses(): Collection<Business> {
        return this.db.collection<Business>("businesses");
    }
    // Categories Collection
    get categories(): Collection<Category> {
        return this.db.collection<Category>("categories");
    }
    // Cities Collection
    get cities(): Collection<City> {
        return this.db.collection<City>("cities");
    }
    // Reviews Collection
    get reviews(): Collection<Review> {
        return this.db.collection<Review>("reviews");
    }
    // Create indexes for better performance
    async createIndexes() {
        try {
            // Business indexes
            await this.businesses.createIndex({ category: 1, city: 1 });
            await this.businesses.createIndex({ status: 1 });
            await this.businesses.createIndex({ featured: 1, featuredAt: -1 });
            await this.businesses.createIndex({ createdAt: -1 });
            await this.businesses.createIndex({ slug: 1 }, { unique: true, partialFilterExpression: { slug: { $exists: true } } });
            await this.businesses.createIndex({ name: "text", description: "text" });
            // Duplicate check indexes (case-insensitive / normalized)
            await this.businesses.createIndex({ name: 1, city: 1, category: 1 }, { collation: { locale: 'en', strength: 2 } });
            await this.businesses.createIndex({ email: 1 }, { collation: { locale: 'en', strength: 2 } });
            await this.businesses.createIndex({ phoneDigits: 1 }, { sparse: true });
            await this.businesses.createIndex({ websiteNormalized: 1 }, { sparse: true });
            await this.businesses.createIndex({ locationVerified: 1 });
            try {
                await this.businesses.createIndex({ location: '2dsphere' }, { sparse: true });
            } catch (_) { /* optional geo index */ }
            // Category indexes
            await this.categories.createIndex({ slug: 1 }, { unique: true });
            await this.categories.createIndex({ isActive: 1 });
            // City indexes
            await this.cities.createIndex({ slug: 1 }, { unique: true });
            await this.cities.createIndex({ isActive: 1 });
            // Review indexes
            await this.reviews.createIndex({ businessId: 1, createdAt: -1 });
            await this.reviews.createIndex({ businessId: 1, rating: -1 });
            logger.log("Database indexes created successfully");
        } catch (error) {
            logger.error("Error creating indexes:", error);
        }
    }
    // Initialize default data
    async initializeDefaultData() {
        try {
            // Check if categories exist
            const categoryCount = await this.categories.countDocuments();
            if (categoryCount === 0) {
                const defaultCategories: Category[] = [
                    {
                        name: "Restaurants",
                        slug: "restaurants",
                        icon: "🍽️",
                        description: "Dining and food services",
                        count: 0,
                        isActive: true,
                        subcategories: [],
                        createdAt: new Date(),
                    },
                    {
                        name: "Healthcare",
                        slug: "healthcare",
                        icon: "🏥",
                        description: "Medical and health services",
                        count: 0,
                        isActive: true,
                        subcategories: [],
                        createdAt: new Date(),
                    },
                    {
                        name: "Education",
                        slug: "education",
                        icon: "🏫",
                        description: "Educational institutions and services",
                        count: 0,
                        isActive: true,
                        subcategories: [],
                        createdAt: new Date(),
                    },
                    {
                        name: "Automotive",
                        slug: "automotive",
                        icon: "🚗",
                        description: "Automotive repair and services",
                        count: 0,
                        isActive: true,
                        subcategories: [],
                        createdAt: new Date(),
                    },
                    {
                        name: "Beauty & Salon",
                        slug: "beauty-salon",
                        icon: "✂️",
                        description: "Beauty and salon services",
                        count: 0,
                        isActive: true,
                        subcategories: [],
                        createdAt: new Date(),
                    },
                    {
                        name: "Shopping",
                        slug: "shopping",
                        icon: "🛍️",
                        description: "Retail and shopping centers",
                        count: 0,
                        isActive: true,
                        subcategories: [],
                        createdAt: new Date(),
                    },
                ];
                await this.categories.insertMany(defaultCategories);
                logger.log("Default categories inserted");
            }
            // Check if cities exist
            const cityCount = await this.cities.countDocuments();
            if (cityCount === 0) {
                const defaultCities: City[] = [
                    // Global Cities
                    { name: "New York", slug: "new-york", province: "New York", country: "United States", isActive: true, createdAt: new Date() },
                    { name: "Los Angeles", slug: "los-angeles", province: "California", country: "United States", isActive: true, createdAt: new Date() },
                    { name: "London", slug: "london", province: "England", country: "United Kingdom", isActive: true, createdAt: new Date() },
                    { name: "Toronto", slug: "toronto", province: "Ontario", country: "Canada", isActive: true, createdAt: new Date() },
                    { name: "Sydney", slug: "sydney", province: "New South Wales", country: "Australia", isActive: true, createdAt: new Date() },
                    { name: "Berlin", slug: "berlin", province: "Berlin", country: "Germany", isActive: true, createdAt: new Date() },
                    { name: "Paris", slug: "paris", province: "Île-de-France", country: "France", isActive: true, createdAt: new Date() },
                    { name: "Mumbai", slug: "mumbai", province: "Maharashtra", country: "India", isActive: true, createdAt: new Date() },
                    { name: "Dubai", slug: "dubai", province: "Dubai", country: "UAE", isActive: true, createdAt: new Date() },
                    // Pakistan Cities
                    { name: "Karachi", slug: "karachi", province: "Sindh", country: "Pakistan", isActive: true, createdAt: new Date() },
                    { name: "Lahore", slug: "lahore", province: "Punjab", country: "Pakistan", isActive: true, createdAt: new Date() },
                    { name: "Islamabad", slug: "islamabad", province: "Federal Capital", country: "Pakistan", isActive: true, createdAt: new Date() },
                    { name: "Rawalpindi", slug: "rawalpindi", province: "Punjab", country: "Pakistan", isActive: true, createdAt: new Date() },
                    { name: "Faisalabad", slug: "faisalabad", province: "Punjab", country: "Pakistan", isActive: true, createdAt: new Date() },
                    { name: "Multan", slug: "multan", province: "Punjab", country: "Pakistan", isActive: true, createdAt: new Date() }
                ];
                await this.cities.insertMany(defaultCities);
                logger.log("Default cities inserted");
            }
        } catch (error) {
            logger.error("Error initializing default data:", error);
        }
    }
}

// Define type for getModels function with _indexesCreated property
interface GetModelsFunction extends Function {
    _indexesCreated?: boolean;
}

// Helper function to get models instance
const getModels: GetModelsFunction = async () => {
    const db = await getDb();
    const models = new DatabaseModels(db);
    // Lazily ensure indexes are created once per runtime
    try {
        if (!getModels._indexesCreated) {
            await models.createIndexes();
            getModels._indexesCreated = true;
        }
    } catch (e) {
        logger.warn("Index creation skipped/failed:", (e as Error)?.message || e);
    }
    return models;
};

export { DatabaseModels, getModels };