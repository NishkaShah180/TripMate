import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import Trip from './src/models/Trip.js';

async function runTripEditingTests() {
  console.log('========================================================================');
  console.log('   STAGE 2B: TRIP EDITING API VERIFICATION (PUT /api/trips/:id)         ');
  console.log('========================================================================');

  await connectDB();
  const PORT = 5005;
  const server = app.listen(PORT);
  await new Promise((resolve) => setTimeout(resolve, 300));

  const BASE_URL = `http://localhost:${PORT}/api/trips`;
  let testTripId = null;

  try {
    // -------------------------------------------------------------
    // Setup: Create an initial trip with participant & inviteCode
    // -------------------------------------------------------------
    console.log('\n[Setup] Creating initial test trip with organizer participant...');
    const initialPayload = {
      name: 'Original Ladakh Trek',
      destination: 'Leh Ladakh',
      startDate: '2026-11-10',
      endDate: '2026-11-20',
      description: 'Original high altitude mountain trek',
      organizerName: 'Heer Shah',
      organizerEmail: 'heer@example.com',
    };

    const createRes = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(initialPayload),
    });
    const createData = await createRes.json();
    if (createRes.status !== 201 || !createData.trip?._id) {
      throw new Error('Setup failed: Could not create initial test trip');
    }

    testTripId = createData.trip._id;
    const originalInviteCode = createData.trip.inviteCode;
    const originalParticipants = createData.trip.participants;
    const originalCreatedAt = createData.trip.createdAt;
    const originalUpdatedAt = createData.trip.updatedAt;

    console.log(`Initial trip created (ID: ${testTripId})`);
    console.log(`Invite code: ${originalInviteCode}, Participants count: ${originalParticipants.length}`);

    // Small delay to ensure timestamp progression for updatedAt
    await new Promise((resolve) => setTimeout(resolve, 200));

    // -------------------------------------------------------------
    // Test 1: Existing trip can be retrieved
    // -------------------------------------------------------------
    console.log('\n[Test 1] Retrieving existing trip via GET /api/trips/:id...');
    const res1 = await fetch(`${BASE_URL}/${testTripId}`);
    const data1 = await res1.json();
    console.log(`Status: ${res1.status} (expected 200)`);
    if (res1.status !== 200 || !data1.success || data1.trip._id !== testTripId) {
      throw new Error('Test 1 failed: Could not retrieve existing trip');
    }
    console.log(`Retrieved trip: "${data1.trip.name}" to "${data1.trip.destination}"`);

    // -------------------------------------------------------------
    // Test 2: Valid updates return HTTP 200
    // -------------------------------------------------------------
    console.log('\n[Test 2] Updating trip details with valid payload via PUT /api/trips/:id...');
    const updatedPayload = {
      name: 'Updated Ladakh Winter Trek',
      destination: 'Leh, Ladakh, India',
      startDate: '2026-11-12',
      endDate: '2026-11-25',
      description: 'Extended winter trek covering Pangong Lake and Nubra Valley',
    };

    const res2 = await fetch(`${BASE_URL}/${testTripId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPayload),
    });
    const data2 = await res2.json();
    console.log(`Status: ${res2.status} (expected 200)`);
    console.log('Response message:', data2.message);
    if (res2.status !== 200 || !data2.success || !data2.trip) {
      throw new Error(`Test 2 failed: Valid update failed with status ${res2.status}`);
    }

    // -------------------------------------------------------------
    // Test 3: Updated values persist in MongoDB
    // -------------------------------------------------------------
    console.log('\n[Test 3] Verifying updated values directly in MongoDB...');
    const dbTrip = await Trip.findById(testTripId);
    if (!dbTrip) {
      throw new Error('Test 3 failed: Trip not found in MongoDB');
    }
    console.log(`Persisted Name: "${dbTrip.name}"`);
    console.log(`Persisted Destination: "${dbTrip.destination}"`);
    console.log(`Persisted Description: "${dbTrip.description}"`);
    if (
      dbTrip.name !== updatedPayload.name ||
      dbTrip.destination !== updatedPayload.destination ||
      dbTrip.description !== updatedPayload.description
    ) {
      throw new Error('Test 3 failed: MongoDB persisted values do not match updated payload');
    }

    // -------------------------------------------------------------
    // Test 4: Participants and inviteCode remain unchanged
    // -------------------------------------------------------------
    console.log('\n[Test 4] Verifying participants and inviteCode remain preserved...');
    console.log(`DB Invite Code: ${dbTrip.inviteCode} (expected: ${originalInviteCode})`);
    console.log(`DB Participants count: ${dbTrip.participants.length} (expected: ${originalParticipants.length})`);
    if (dbTrip.inviteCode !== originalInviteCode) {
      throw new Error('Test 4 failed: inviteCode was mutated during trip update');
    }
    if (dbTrip.participants.length !== originalParticipants.length) {
      throw new Error('Test 4 failed: participants array length changed during trip update');
    }
    if (dbTrip.participants[0].name !== originalParticipants[0].name) {
      throw new Error('Test 4 failed: participant details altered during trip update');
    }
    console.log('Preservation check passed: participants and inviteCode are intact.');

    // -------------------------------------------------------------
    // Test 5: createdAt is preserved and updatedAt is updated
    // -------------------------------------------------------------
    console.log('\n[Test 5] Verifying timestamp integrity (createdAt preserved, updatedAt updated)...');
    const dbCreatedAt = new Date(dbTrip.createdAt).toISOString();
    const dbUpdatedAt = new Date(dbTrip.updatedAt).getTime();
    const origUpdatedAtTime = new Date(originalUpdatedAt).getTime();

    console.log(`Original createdAt: ${originalCreatedAt}`);
    console.log(`Persisted createdAt: ${dbCreatedAt}`);
    console.log(`Original updatedAt: ${originalUpdatedAt}`);
    console.log(`Persisted updatedAt: ${dbTrip.updatedAt}`);

    if (dbCreatedAt !== new Date(originalCreatedAt).toISOString()) {
      throw new Error('Test 5 failed: createdAt timestamp was mutated');
    }
    if (dbUpdatedAt < origUpdatedAtTime) {
      throw new Error('Test 5 failed: updatedAt was not refreshed on update');
    }
    console.log('Timestamp check passed: createdAt preserved, updatedAt refreshed.');

    // -------------------------------------------------------------
    // Test 6: Invalid date ranges return HTTP 400
    // -------------------------------------------------------------
    console.log('\n[Test 6] Testing invalid date range (endDate < startDate)...');
    const invalidDatesPayload = {
      name: 'Invalid Dates Trip',
      destination: 'Goa',
      startDate: '2026-11-20',
      endDate: '2026-11-10', // earlier!
    };
    const res6 = await fetch(`${BASE_URL}/${testTripId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidDatesPayload),
    });
    const data6 = await res6.json();
    console.log(`Status: ${res6.status} (expected 400)`);
    console.log('Response:', data6.message);
    if (res6.status !== 400 || data6.success !== false || !data6.message.includes('End date cannot be earlier than start date')) {
      throw new Error('Test 6 failed: Inverted date range was not rejected with 400');
    }

    // -------------------------------------------------------------
    // Test 7: Malformed IDs return HTTP 400
    // -------------------------------------------------------------
    console.log('\n[Test 7] Testing malformed trip ID (PUT /api/trips/invalid-id-123)...');
    const res7 = await fetch(`${BASE_URL}/invalid-id-123`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPayload),
    });
    const data7 = await res7.json();
    console.log(`Status: ${res7.status} (expected 400)`);
    console.log('Response:', data7.message);
    if (res7.status !== 400 || data7.success !== false || !data7.message.includes('Invalid trip ID format')) {
      throw new Error('Test 7 failed: Malformed ID was not rejected with 400');
    }

    // -------------------------------------------------------------
    // Test 8: Nonexistent trips return HTTP 404
    // -------------------------------------------------------------
    console.log('\n[Test 8] Testing nonexistent trip ID (PUT /api/trips/507f1f77bcf86cd799439011)...');
    const nonExistentId = '507f1f77bcf86cd799439011';
    const res8 = await fetch(`${BASE_URL}/${nonExistentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPayload),
    });
    const data8 = await res8.json();
    console.log(`Status: ${res8.status} (expected 404)`);
    console.log('Response:', data8.message);
    if (res8.status !== 404 || data8.success !== false || !data8.message.includes('Trip not found')) {
      throw new Error('Test 8 failed: Nonexistent trip was not rejected with 404');
    }

    console.log('\n========================================================================');
    console.log('   ALL 8 TRIP EDITING TESTS PASSED SUCCESSFULLY!                        ');
    console.log('========================================================================');
  } finally {
    // Cleanup temporary test trip
    if (testTripId) {
      await Trip.findByIdAndDelete(testTripId);
      console.log(`Cleaned up temporary test trip (${testTripId}).`);
    }

    await mongoose.connection.close();
    server.close();
  }
}

runTripEditingTests().catch((err) => {
  console.error('\n❌ Test execution failed with error:', err);
  process.exit(1);
});
