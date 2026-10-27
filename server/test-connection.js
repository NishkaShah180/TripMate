import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';

async function testStage1() {
  console.log('--- STAGE 1 VERIFICATION START ---');
  
  // 1. Test MongoDB connection
  console.log('[1/3] Connecting to MongoDB...');
  await connectDB();
  const dbState = mongoose.connection.readyState;
  console.log(`[1/3] Mongoose connection readyState: ${dbState} (1 = connected)`);
  if (dbState !== 1) {
    throw new Error('MongoDB failed to connect properly');
  }

  // 2. Start HTTP server
  console.log('[2/3] Starting Express HTTP server on port 5000...');
  const server = app.listen(5000);
  await new Promise((resolve) => setTimeout(resolve, 500));

  // 3. Test GET /api/health
  console.log('[2/3] Querying GET http://localhost:5000/api/health...');
  const response = await fetch('http://localhost:5000/api/health');
  const data = await response.json();
  console.log('[2/3] Response status:', response.status);
  console.log('[2/3] Response body:', JSON.stringify(data, null, 2));

  if (response.status !== 200 || data.status !== 'ok') {
    throw new Error('Health check endpoint did not return expected response');
  }

  // Clean shutdown
  console.log('[3/3] Shutting down test server and closing MongoDB connection...');
  await new Promise((resolve) => server.close(resolve));
  await mongoose.connection.close();
  console.log('--- STAGE 1 VERIFICATION SUCCESS ---');
}

testStage1().catch((err) => {
  console.error('Stage 1 verification failed:', err);
  process.exit(1);
});
