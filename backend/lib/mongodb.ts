import { MongoClient, Db } from 'mongodb';
import { logger } from './logger';

const MONGODB_DB = process.env.MONGODB_DB || 'BizBranches';

// Global connection cache
let client: MongoClient | null = null;
let cachedDb: Db | null = null;

function getClient(): MongoClient {
  if (!client) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      logger.error('MONGODB_URI is undefined. Check environment variables.');
      throw new Error('MONGODB_URI environment variable is not defined');
    }
    logger.log('Connecting to MongoDB (database:', MONGODB_DB + ')');

    client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  }
  return client;
}

export async function getDb(): Promise<Db> {
  if (cachedDb) {
    try {
      await cachedDb.admin().ping();
      return cachedDb;
    } catch (error) {
      logger.log('Cached connection failed, reconnecting...');
      cachedDb = null;
      client = null;
    }
  }

  try {
    const mongoClient = getClient();
    await mongoClient.connect();
    cachedDb = mongoClient.db(MONGODB_DB);
    logger.log('Connected to MongoDB:', MONGODB_DB);
    return cachedDb;
  } catch (error) {
    logger.error('MongoDB connection error:', (error as Error).message);
    throw new Error(`Failed to connect to MongoDB: ${(error as Error).message}`);
  }
}

export async function closeDb(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    cachedDb = null;
    logger.log('MongoDB connection closed');
  }
}
