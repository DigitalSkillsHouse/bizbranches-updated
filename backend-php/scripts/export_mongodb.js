const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://your_db_user:your_db_password@your_cluster.mongodb.net/BizBranches?retryWrites=true&w=majority';
const DB_NAME = 'BizBranches';
const OUTPUT_DIR = __dirname;

const COLLECTIONS = ['businesses', 'categories', 'cities', 'reviews', 'users'];

async function main() {
    console.log('=== MongoDB Export Tool ===\n');
    console.log('Connecting to MongoDB...');

    const client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('Connected!\n');

    const db = client.db(DB_NAME);

    const allCollections = await db.listCollections().toArray();
    console.log('Available collections:', allCollections.map(c => c.name).join(', '), '\n');

    for (const name of COLLECTIONS) {
        try {
            const coll = db.collection(name);
            const count = await coll.countDocuments();
            console.log(`Exporting "${name}" (${count} documents)...`);

            const docs = await coll.find({}).toArray();
            const outPath = path.join(OUTPUT_DIR, `${name}.json`);
            fs.writeFileSync(outPath, JSON.stringify(docs, null, 2), 'utf-8');

            const sizeKB = (fs.statSync(outPath).size / 1024).toFixed(1);
            console.log(`  -> Saved ${outPath} (${sizeKB} KB, ${docs.length} docs)\n`);
        } catch (err) {
            console.error(`  ERROR exporting "${name}": ${err.message}\n`);
        }
    }

    await client.close();
    console.log('=== Export Complete ===');
}

main().catch(err => {
    console.error('Fatal error:', err.message);
    process.exit(1);
});
