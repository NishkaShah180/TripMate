import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import Trip from './src/models/Trip.js';

async function runParticipantInvitationTests() {
  console.log('========================================================================');
  console.log('   MODULE 2 (PART 1): PARTICIPANT MANAGEMENT & INVITATIONS VERIFICATION ');
  console.log('========================================================================');

  await connectDB();
  const PORT = 5003;
  const server = app.listen(PORT);
  await new Promise((resolve) => setTimeout(resolve, 300));

  const BASE_URL = `http://localhost:${PORT}/api/trips`;
  let testTripId = null;

  try {
    // -------------------------------------------------------------
    // Test 1: Create a trip with initial organizer
    // -------------------------------------------------------------
    console.log('\n[Test 1] Creating a trip with initial organizer (Heer Shah)...');
    const tripPayload = {
      name: 'Manali Winter Expedition',
      destination: 'Manali, Himachal Pradesh',
      startDate: '2026-12-20',
      endDate: '2026-12-26',
      description: 'Mountain trek and winter sightseeing with friends',
      organizerName: 'Heer Shah',
      organizerEmail: 'heer@example.com',
    };

    const res1 = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tripPayload),
    });

    const data1 = await res1.json();
    console.log(`Status: ${res1.status} (expected 201)`);
    if (res1.status !== 201 || !data1.success || !data1.trip?._id) {
      throw new Error(`Test 1 failed: ${data1.message || 'Trip creation failed'}`);
    }

    testTripId = data1.trip._id;
    const organizer = data1.trip.participants.find((p) => p.name === 'Heer Shah');
    if (!organizer || organizer.role !== 'organizer') {
      throw new Error('Test 1 failed: Organizer participant was not attached properly');
    }
    console.log(`Trip created (ID: ${testTripId}), Organizer: ${organizer.name}, Invite Code: ${data1.trip.inviteCode}`);

    // -------------------------------------------------------------
    // Test 2: Add participant to trip
    // -------------------------------------------------------------
    console.log('\n[Test 2] Adding participant (Nishka Shah) to trip...');
    const res2 = await fetch(`${BASE_URL}/${testTripId}/participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Nishka Shah',
        email: 'nishka@example.com',
        role: 'member',
      }),
    });
    const data2 = await res2.json();
    console.log(`Status: ${res2.status} (expected 201)`);
    if (res2.status !== 201 || !data2.success) {
      throw new Error('Test 2 failed: Could not add participant');
    }

    // -------------------------------------------------------------
    // Test 3: Reject duplicate participant
    // -------------------------------------------------------------
    console.log('\n[Test 3] Testing duplicate participant rejection...');
    const res3 = await fetch(`${BASE_URL}/${testTripId}/participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Nishka Shah',
        email: 'nishka@example.com',
      }),
    });
    const data3 = await res3.json();
    console.log(`Status: ${res3.status} (expected 400 rejection)`);
    console.log(`Response message: ${data3.message}`);
    if (res3.status !== 400 || data3.success !== false) {
      throw new Error('Test 3 failed: Duplicate participant should be rejected with 400');
    }

    // -------------------------------------------------------------
    // Test 4: Invite a participant via email/code
    // -------------------------------------------------------------
    console.log('\n[Test 4] Generating trip invitation...');
    const res4 = await fetch(`${BASE_URL}/${testTripId}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Aman Verma',
        email: 'aman@example.com',
      }),
    });
    const data4 = await res4.json();
    console.log(`Status: ${res4.status} (expected 200)`);
    if (res4.status !== 200 || !data4.success || data4.inviteCode !== data1.trip.inviteCode) {
      throw new Error('Test 4 failed: Invitation generation failed');
    }
    console.log(`Generated invite for ${data4.participant.name} with code: ${data4.inviteCode}`);

    // -------------------------------------------------------------
    // Test 5: Join trip via invite code
    // -------------------------------------------------------------
    console.log('\n[Test 5] Joining trip using invite code (Rahul Sharma)...');
    const inviteCode = data1.trip.inviteCode;
    const res5 = await fetch(`${BASE_URL}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inviteCode,
        name: 'Rahul Sharma',
        email: 'rahul@example.com',
      }),
    });
    const data5 = await res5.json();
    console.log(`Status: ${res5.status} (expected 200)`);
    if (res5.status !== 200 || !data5.success) {
      throw new Error('Test 5 failed: Joining trip via invite code failed');
    }
    console.log(`Joined message: ${data5.message}`);

    // -------------------------------------------------------------
    // Test 6: Verify trip preview by invite code
    // -------------------------------------------------------------
    console.log('\n[Test 6] Fetching public trip preview by invite code...');
    const res6 = await fetch(`${BASE_URL}/invite/${inviteCode}`);
    const data6 = await res6.json();
    console.log(`Status: ${res6.status} (expected 200)`);
    console.log(`Preview: ${data6.trip.name} to ${data6.trip.destination}, Members: ${data6.trip.participantCount}`);
    if (res6.status !== 200 || data6.trip.participantCount !== 4) {
      throw new Error('Test 6 failed: Trip preview mismatch');
    }

    // -------------------------------------------------------------
    // Test 7: Verify directly in MongoDB
    // -------------------------------------------------------------
    console.log('\n[Test 7] Verifying participant persistence directly in MongoDB...');
    const storedTrip = await Trip.findById(testTripId);
    if (!storedTrip || storedTrip.participants.length !== 4) {
      throw new Error('Test 7 failed: Incorrect participant count in MongoDB');
    }
    console.log(`Stored participants in DB: ${storedTrip.participants.map((p) => p.name).join(', ')}`);

    // -------------------------------------------------------------
    // Test 8: Remove a participant
    // -------------------------------------------------------------
    console.log('\n[Test 8] Removing participant (Aman Verma)...');
    const aman = storedTrip.participants.find((p) => p.name === 'Aman Verma');
    const res8 = await fetch(`${BASE_URL}/${testTripId}/participants/${aman._id}`, {
      method: 'DELETE',
    });
    const data8 = await res8.json();
    console.log(`Status: ${res8.status} (expected 200)`);
    if (res8.status !== 200 || !data8.success) {
      throw new Error('Test 8 failed: Participant removal failed');
    }

    const tripAfterRemoval = await Trip.findById(testTripId);
    console.log(`Participant count after removal: ${tripAfterRemoval.participants.length} (expected 3)`);
    if (tripAfterRemoval.participants.length !== 3) {
      throw new Error('Test 8 failed: Participant was not removed from DB');
    }

    console.log('\n========================================================================');
    console.log('   ALL 8 PARTICIPANT & INVITATION TESTS PASSED SUCCESSFULLY!            ');
    console.log('========================================================================');
  } finally {
    // Cleanup
    if (testTripId) {
      await Trip.findByIdAndDelete(testTripId);
      console.log(`Cleaned up test trip (${testTripId}).`);
    }

    await mongoose.connection.close();
    server.close();
  }
}

runParticipantInvitationTests().catch((err) => {
  console.error('\n❌ Test execution failed with error:', err);
  process.exit(1);
});
