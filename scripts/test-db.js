const dotenv = require('dotenv');
const dns = require('dns');
const { MongoClient } = require('mongodb');
const path = require('path');
const fs = require('fs');

const envPath = '/Users/8bit/Desktop/artterminal/.env.local';
console.log('Looking for .env.local at:', envPath);
console.log('File exists:', fs.existsSync(envPath));

dotenv.config({ path: envPath });
console.log('Environment variables loaded');
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is not defined in .env.local');
  console.log('Current working directory:', process.cwd());
  console.log('Available env vars:', Object.keys(process.env));
  process.exit(1);
}

// Validate MongoDB URI format
try {
  const url = new URL(uri);
  console.log('MongoDB URI validation:', {
    protocol: url.protocol,
    hostname: url.hostname,
    pathname: url.pathname,
    searchParams: Object.fromEntries(url.searchParams)
  });
} catch (err) {
  console.error('Invalid MongoDB URI format:', err);
  process.exit(1);
}

console.log('MongoDB URI found and validated, attempting connection...');

async function testConnection() {
  try {
    // Extract hostname from MongoDB URI
    const url = new URL(uri);
    const hostname = url.hostname;
    
    // Test DNS resolution
    console.log(`Testing DNS resolution for ${hostname}...`);
    const addresses = await dns.promises.resolve(hostname);
    console.log('DNS resolution successful:', addresses);
    
    // Attempt MongoDB connection with minimal options
    console.log('Attempting MongoDB connection...');
    const client = new MongoClient(uri, {
      connectTimeoutMS: 30000,
      serverSelectionTimeoutMS: 30000
    });
    
    await client.connect();
    console.log('Successfully connected to MongoDB');
    
    const db = client.db('artterminal');
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    await client.close();
    console.log('Connection test complete');
    
  } catch (err) {
    console.error('Error details:', {
      name: err.name,
      message: err.message,
      code: err.code,
      stack: err.stack
    });
    process.exit(1);
  }
}

// Run the test
testConnection().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
