import { MONGODB_URI, MONGODB_DATABASE } from '$env/static/private';
import { Db, MongoClient } from 'mongodb';

let client: MongoClient;
let db: Db;
let isConnected = false;

async function connect() {
    try {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        db = client.db(MONGODB_DATABASE);
        isConnected = true;
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB: ', error);
        isConnected = false;
        setTimeout(connect, 10000); // Retry after 10 seconds
    }
}

export async function getDb() {
    if (!isConnected || !db) {
        await connect();
    }
  return db;
}

export async function close() {
    try {
        await client.close();
        isConnected = false;
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error disconnecting from MongoDB:', error);
    }
}
