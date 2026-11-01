import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import Trip from './src/models/Trip.js';

async function runParticipantPersistenceTests() {
  console.log('========================================================================');
  console.log('   MODULE 2 (PART 2): ADD & REMOVE PARTICIPANTS WITH MONGODB PERSISTENCE ');
  console.log('========================================================================');

  await connectDB();
  const PORT = 5004;
  const server = app.listen(PORT);
  await new Promise((resolve) => setTimeout(resolve, 300));

  const BASE_URL = `http://localhost:${PORT}/api/trips`;
  let testTripId = null;

  try {
    // -------------------------------------------------------------
    // Setup: Create an initial trip with an organizer participant
    // -------------------------------------------------------------
    console.log('\n[Setup] Creating initial test trip with organizer participant in MongoDB...');
    const tripPayload = {
      name: 'Rishikesh Rafting & Camping',
      destination: 'Rishikesh, Uttarakhand',
      startDate: '2026-12-05',
      endDate: '2026-12-09',
      description: 'Adventure weekend with river rafting and riverside camping',
      organizerName: 'Heer Shah',
      organizerEmail: 'heer@tripmate.com',
    };

    const setupRes = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tripPayload),
    });

    const setupData = await setupRes.json();
    if (setupRes.status !== 201 || !setupData.success || !setupData.trip?._id) {
      throw new Error(`Setup failed: ${setupData.message || 'Trip creation failed'}`);
    }

    testTripId = setupData.trip._id;
    const initialOrganizer = setupData.trip.participants.find((p) => p.name === 'Heer Shah');
    console.log(`Trip created (ID: ${testTripId}) with organizer: ${initialOrganizer.name} (${initialOrganizer._id})`);

    // -------------------------------------------------------------
    // Test 1: Retrieve participants via GET /api/trips/:id/participants
    // -------------------------------------------------------------
    console.log('\n[Test 1] Retrieving participants via GET /api/trips/:id/participants...');
    const res1 = await fetch(`${BASE_URL}/${testTripId}/participants`);
    const data1 = await res1.json();
    console.log(`Status: ${res1.status} (expected 200)`);
    console.log(`Counts: Total = ${data1.count}, Organizers = ${data1.organizerCount}, Members = ${data1.memberCount}`);

    if (res1.status !== 200 || !data1.success || data1.count !== 1 || data1.organizerCount !== 1) {
      throw new Error('Test 1 failed: GET participants did not return expected initial participant counts');
    }

    // -------------------------------------------------------------
    // Test 2: Add a new member participant via POST /api/trips/:id/participants
    // -------------------------------------------------------------
    console.log('\n[Test 2] Adding a new participant (Nishka Shah) via POST /api/trips/:id/participants...');
    const res2 = await fetch(`${BASE_URL}/${testTripId}/participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Nishka Shah',
        email: 'nishka@tripmate.com',
        role: 'member',
      }),
    });
    const data2 = await res2.json();
    console.log(`Status: ${res2.status} (expected 201)`);
    console.log(`Response message: ${data2.message}`);

    if (res2.status !== 201 || !data2.success || !data2.participant?._id) {
      throw new Error('Test 2 failed: Participant was not added with 201');
    }
    const nishkaId = data2.participant._id;

    // -------------------------------------------------------------
    // Test 3: Verify persistence directly in MongoDB
    // -------------------------------------------------------------
    console.log('\n[Test 3] Verifying participant persistence directly in MongoDB...');
    const dbTripAfterAdd = await Trip.findById(testTripId);
    if (!dbTripAfterAdd) {
      throw new Error('Test 3 failed: Trip not found in MongoDB');
    }
    const foundNishka = dbTripAfterAdd.participants.id(nishkaId);
    if (!foundNishka) {
      throw new Error('Test 3 failed: Participant was not persisted in MongoDB subdocuments');
    }
    console.log(`Found in MongoDB: ${foundNishka.name} (${foundNishka.email}), Role: ${foundNishka.role}, ID: ${foundNishka._id}`);
    if (foundNishka.name !== 'Nishka Shah' || foundNishka.email !== 'nishka@tripmate.com') {
      throw new Error('Test 3 failed: Persisted participant data does not match input');
    }

    // -------------------------------------------------------------
    // Test 4: Add another participant (Karan Patel) as second organizer
    // -------------------------------------------------------------
    console.log('\n[Test 4] Adding second organizer (Karan Patel)...');
    const res4 = await fetch(`${BASE_URL}/${testTripId}/participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Karan Patel',
        email: 'karan@tripmate.com',
        role: 'organizer',
      }),
    });
    const data4 = await res4.json();
    console.log(`Status: ${res4.status} (expected 201)`);
    if (res4.status !== 201 || !data4.success) {
      throw new Error('Test 4 failed: Could not add second organizer');
    }
    const karanId = data4.participant._id;

    // Verify updated participant count
    const listRes = await fetch(`${BASE_URL}/${testTripId}/participants`);
    const listData = await listRes.json();
    console.log(`Updated count: Total = ${listData.count} (expected 3), Organizers = ${listData.organizerCount} (expected 2)`);
    if (listData.count !== 3 || listData.organizerCount !== 2) {
      throw new Error('Test 4 failed: Incorrect participant count after adding second organizer');
    }

    // -------------------------------------------------------------
    // Test 5: Validation - Missing participant name returns 400
    // -------------------------------------------------------------
    console.log('\n[Test 5] Testing missing participant name validation...');
    const res5 = await fetch(`${BASE_URL}/${testTripId}/participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'noname@tripmate.com',
      }),
    });
    const data5 = await res5.json();
    console.log(`Status: ${res5.status} (expected 400)`);
    console.log(`Response message: ${data5.message}`);
    if (res5.status !== 400 || data5.success !== false) {
      throw new Error('Test 5 failed: Missing name was not rejected with 400');
    }

    // -------------------------------------------------------------
    // Test 6: Validation - Invalid email format returns 400
    // -------------------------------------------------------------
    console.log('\n[Test 6] Testing invalid email format validation...');
    const res6 = await fetch(`${BASE_URL}/${testTripId}/participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Invalid Email User',
        email: 'invalid-email-format',
      }),
    });
    const data6 = await res6.json();
    console.log(`Status: ${res6.status} (expected 400)`);
    console.log(`Response message: ${data6.message}`);
    if (res6.status !== 400 || data6.success !== false || !data6.message.includes('Invalid email format')) {
      throw new Error('Test 6 failed: Invalid email was not rejected with 400');
    }

    // -------------------------------------------------------------
    // Test 7: Validation - Duplicate participant name returns 400
    // -------------------------------------------------------------
    console.log('\n[Test 7] Testing duplicate participant name rejection...');
    const res7 = await fetch(`${BASE_URL}/${testTripId}/participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'nishka shah', // lowercase duplicate
        email: 'different@tripmate.com',
      }),
    });
    const data7 = await res7.json();
    console.log(`Status: ${res7.status} (expected 400)`);
    console.log(`Response message: ${data7.message}`);
    if (res7.status !== 400 || data7.success !== false) {
      throw new Error('Test 7 failed: Duplicate name was not rejected with 400');
    }

    // -------------------------------------------------------------
    // Test 8: Validation - Duplicate participant email returns 400
    // -------------------------------------------------------------
    console.log('\n[Test 8] Testing duplicate participant email rejection...');
    const res8 = await fetch(`${BASE_URL}/${testTripId}/participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Person',
        email: 'NISHKA@TRIPMATE.COM', // uppercase duplicate
      }),
    });
    const data8 = await res8.json();
    console.log(`Status: ${res8.status} (expected 400)`);
    console.log(`Response message: ${data8.message}`);
    if (res8.status !== 400 || data8.success !== false) {
      throw new Error('Test 8 failed: Duplicate email was not rejected with 400');
    }

    // -------------------------------------------------------------
    // Test 9: Update participant role via PUT /api/trips/:id/participants/:participantId
    // -------------------------------------------------------------
    console.log('\n[Test 9] Updating Nishka Shah role to organizer...');
    const res9 = await fetch(`${BASE_URL}/${testTripId}/participants/${nishkaId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'organizer',
      }),
    });
    const data9 = await res9.json();
    console.log(`Status: ${res9.status} (expected 200)`);
    console.log(`Updated participant: ${data9.participant.name}, new role: ${data9.participant.role}`);
    if (res9.status !== 200 || data9.participant.role !== 'organizer') {
      throw new Error('Test 9 failed: Participant role was not updated to organizer');
    }

    // -------------------------------------------------------------
    // Test 10: Verify role update persistence directly in MongoDB
    // -------------------------------------------------------------
    console.log('\n[Test 10] Verifying role update persistence directly in MongoDB...');
    const dbTripAfterRoleUpdate = await Trip.findById(testTripId);
    const dbNishka = dbTripAfterRoleUpdate.participants.id(nishkaId);
    if (dbNishka.role !== 'organizer') {
      throw new Error('Test 10 failed: Role change was not persisted in MongoDB');
    }
    console.log(`Verified in MongoDB: ${dbNishka.name} role is "${dbNishka.role}"`);

    // -------------------------------------------------------------
    // Test 11: Remove a participant via DELETE /api/trips/:id/participants/:participantId
    // -------------------------------------------------------------
    console.log('\n[Test 11] Removing participant Karan Patel...');
    const res11 = await fetch(`${BASE_URL}/${testTripId}/participants/${karanId}`, {
      method: 'DELETE',
    });
    const data11 = await res11.json();
    console.log(`Status: ${res11.status} (expected 200)`);
    console.log(`Response message: ${data11.message}`);
    if (res11.status !== 200 || !data11.success) {
      throw new Error('Test 11 failed: Participant removal failed with non-200');
    }

    // -------------------------------------------------------------
    // Test 12: Verify removal persistence directly in MongoDB
    // -------------------------------------------------------------
    console.log('\n[Test 12] Verifying removal persistence directly in MongoDB...');
    const dbTripAfterRemoval = await Trip.findById(testTripId);
    const dbKaran = dbTripAfterRemoval.participants.id(karanId);
    if (dbKaran) {
      throw new Error('Test 12 failed: Participant was still found in MongoDB after deletion');
    }
    console.log(`Verified in MongoDB: Participant (${karanId}) is null. Total participants remaining: ${dbTripAfterRemoval.participants.length} (expected 2)`);
    if (dbTripAfterRemoval.participants.length !== 2) {
      throw new Error('Test 12 failed: Participant count in MongoDB mismatch after deletion');
    }

    // -------------------------------------------------------------
    // Test 13: Edge Case - Malformed IDs return HTTP 400
    // -------------------------------------------------------------
    console.log('\n[Test 13] Testing malformed trip ID and participant ID validation...');
    const res13a = await fetch(`${BASE_URL}/invalid-id/participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' }),
    });
    const data13a = await res13a.json();
    console.log(`Malformed trip ID: Status ${res13a.status} (expected 400) - ${data13a.message}`);
    if (res13a.status !== 400 || !data13a.message.includes('Invalid trip ID format')) {
      throw new Error('Test 13a failed: Malformed trip ID was not rejected with 400');
    }

    const res13b = await fetch(`${BASE_URL}/${testTripId}/participants/invalid-participant-id`, {
      method: 'DELETE',
    });
    const data13b = await res13b.json();
    console.log(`Malformed participant ID: Status ${res13b.status} (expected 400) - ${data13b.message}`);
    if (res13b.status !== 400 || !data13b.message.includes('Invalid participant ID format')) {
      throw new Error('Test 13b failed: Malformed participant ID was not rejected with 400');
    }

    // -------------------------------------------------------------
    // Test 14: Nonexistent participant returns HTTP 404
    // -------------------------------------------------------------
    console.log('\n[Test 14] Testing non-existent participant removal...');
    const fakeParticipantId = new mongoose.Types.ObjectId();
    const res14 = await fetch(`${BASE_URL}/${testTripId}/participants/${fakeParticipantId}`, {
      method: 'DELETE',
    });
    const data14 = await res14.json();
    console.log(`Status: ${res14.status} (expected 404) - ${data14.message}`);
    if (res14.status !== 404 || !data14.message.includes('Participant not found in this trip')) {
      throw new Error('Test 14 failed: Non-existent participant was not rejected with 404');
    }

    console.log('\n========================================================================');
    console.log('   ALL 14 PARTICIPANT PERSISTENCE TESTS PASSED SUCCESSFULLY!            ');
    console.log('========================================================================');
  } finally {
    // Cleanup temporary test trip and subdocuments
    if (testTripId) {
      await Trip.findByIdAndDelete(testTripId);
      console.log(`Cleaned up temporary test trip (${testTripId}).`);
    }

    await mongoose.connection.close();
    server.close();
  }
}

runParticipantPersistenceTests().catch((err) => {
  console.error('\n❌ Test execution failed with error:', err);
  process.exit(1);
});
