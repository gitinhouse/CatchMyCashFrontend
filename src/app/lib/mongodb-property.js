import mongoose from "mongoose";

const PROPERTY_MONGO_URI = process.env.PROPERTY_MONGO_URI;

if (!PROPERTY_MONGO_URI) {
  throw new Error("Please define the PROPERTY_MONGO_URI environment variable");
}

let cached = global.mongooseProperty;

if (!cached) {
  cached = global.mongooseProperty = { conn: null, promise: null };
}

async function connectToPropertyDatabase() {
  if (cached.conn && cached.conn.readyState === 1) {
    console.log('✅ Using cached property connection');
    return cached.conn;
  }

  if (cached.conn) {
    console.log('🔄 Property connection state:', cached.conn.readyState);
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    console.log('🔌 Creating new property database connection...');
    
    cached.promise = mongoose.createConnection(PROPERTY_MONGO_URI, {
      serverSelectionTimeoutMS: 30000, // Increased from 10000
      socketTimeoutMS: 120000, // Increased from 45000
      maxPoolSize: 10,
      // Add these for better performance
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      // Disable autoIndex in production for better performance
      autoIndex: process.env.NODE_ENV !== 'production',
    })
    .asPromise()
    .then((connection) => {
      console.log('✅ Property database connected successfully');
      return connection;
    })
    .catch((err) => {
      console.error('❌ Property database connection error:', err);
      cached.promise = null;
      throw err;
    });
  }
  
  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    console.error('❌ Failed to connect to property database:', error);
    cached.promise = null;
    throw error;
  }
}

export default connectToPropertyDatabase;