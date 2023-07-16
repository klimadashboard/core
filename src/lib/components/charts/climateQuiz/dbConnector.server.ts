import { env } from '$env/dynamic/private';
import { Db, MongoClient } from 'mongodb';

const client = new MongoClient(env.MONGODB_URI);
let db: Db;
let isConnected = false;

async function connect() {
    try {
        await client.connect();
        db = client.db(env.MONGODB_DATABASE);
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
