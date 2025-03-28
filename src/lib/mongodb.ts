import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

console.log("MONGODB_URI", uri);
console.log("MONGODB_DB", dbName);

if (!uri) {
    throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// Ensure we reuse the MongoDB client in development (to avoid multiple instances)
if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
}

clientPromise = global._mongoClientPromise;

export async function getDb() {
    const client = await clientPromise;
    return client.db(dbName);
}
