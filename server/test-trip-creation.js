import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import Trip from './src/models/Trip.js';

async function runTests() {
  console.log('==================================================');
  console.log('   STAGE 2A: TRIP CREATION API VERIFICATION       ');
  console.log('==================================================');

  await connectDB();
  const PORT = 5001;
  const server = app.listen(PORT);
  await new Promise((resolve) => setTimeout(resolve, 300));

  const BASE_URL = `http://localhost:${PORT}/api/trips`;
  let testTripId = null;

  try {
    // Test 1: Valid trip creation
    console.log('\n[Test 1] Creating a valid trip...');
    const validPayload = {
      name: 'Goa Getaway',
      destination: 'Goa',
      startDate: '2026-11-01',
      endDate: '2026-11-05',
      description: 'A short trip with friends',
    };

    const res1 = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    });

    const data1 = await res1.json();
    console.log(`Status: ${res1.status} (expected 201)`);
    console.log('Response:', JSON.stringify(data1, null, 2));

    if (res1.status !== 201 || !data1.success || !data1.trip?._id) {
      throw new Error('Test 1 failed: Valid trip was not created with status 201');
    }
    testTripId = data1.trip._id;

    // Test 2: Verify directly in MongoDB
    console.log('\n[Test 2] Verifying trip persistence directly in MongoDB...');
    const foundTrip = await Trip.findById(testTripId);
    if (!foundTrip) {
      throw new Error('Test 2 failed: Trip not found in MongoDB');
    }
    console.log(`Found in MongoDB: ${foundTrip.name} to ${foundTrip.destination} (ID: ${foundTrip._id})`);
    if (foundTrip.name !== 'Goa Getaway' || foundTrip.destination !== 'Goa') {
      throw new Error('Test 2 failed: Stored data mismatch in MongoDB');
    }

    // Test 3: Missing trip name
    console.log('\n[Test 3] Testing missing trip name...');
    const res3 = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: 'Goa',
        startDate: '2026-11-01',
        endDate: '2026-11-05',
      }),
    });
    const data3 = await res3.json();
    console.log(`Status: ${res3.status} (expected 400)`);
    console.log('Response:', data3.message);
    if (res3.status !== 400 || data3.success !== false) {
      throw new Error('Test 3 failed: Missing name should be rejected with 400');
    }

    // Test 4: Missing destination
    console.log('\n[Test 4] Testing missing destination...');
    const res4 = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Solo Trek',
        startDate: '2026-11-01',
        endDate: '2026-11-05',
      }),
    });
    const data4 = await res4.json();
    console.log(`Status: ${res4.status} (expected 400)`);
    console.log('Response:', data4.message);
    if (res4.status !== 400 || data4.success !== false) {
      throw new Error('Test 4 failed: Missing destination should be rejected with 400');
    }

    // Test 5: End date earlier than start date
    console.log('\n[Test 5] Testing end date earlier than start date...');
    const res5 = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Invalid Date Trip',
        destination: 'Manali',
        startDate: '2026-11-10',
        endDate: '2026-11-05', // earlier!
      }),
    });
    const data5 = await res5.json();
    console.log(`Status: ${res5.status} (expected 400)`);
    console.log('Response:', data5.message);
    if (res5.status !== 400 || !data5.message.includes('End date cannot be earlier than start date')) {
      throw new Error('Test 5 failed: Inverted dates should be rejected with 400');
    }

    console.log('\n==================================================');
    console.log('   ALL 5 TESTS PASSED SUCCESSFULLY!               ');
    console.log('==================================================');
  } finally {
    // Cleanup test document
    if (testTripId) {
      await Trip.findByIdAndDelete(testTripId);
      console.log(`Cleaned up test trip (${testTripId})`);
    }
    await new Promise((resolve) => server.close(resolve));
    await mongoose.connection.close();
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
