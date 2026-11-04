import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import Trip from './src/models/Trip.js';

async function runItineraryPersistenceTests() {
  console.log('========================================================================');
  console.log('   STAGE 4B: ITINERARY PERSISTENCE & DAY-WISE MANAGEMENT VERIFICATION   ');
  console.log('========================================================================');

  await connectDB();
  const PORT = 5006;
  const server = app.listen(PORT);
  await new Promise((resolve) => setTimeout(resolve, 300));

  const BASE_URL = `http://localhost:${PORT}/api/trips`;
  let testTripId = null;
  let testTrip2Id = null;
  let firstActivityId = null;

  try {
    // -------------------------------------------------------------
    // Test 1: Create a temporary trip
    // -------------------------------------------------------------
    console.log('\n[Test 1] Creating temporary primary test trip (Goa Holiday)...');
    const primaryTripPayload = {
      name: 'Goa Coastal Getaway',
      destination: 'Goa, India',
      startDate: '2026-11-10',
      endDate: '2026-11-15',
      description: 'Relaxing week of beaches and heritage walks',
      organizerName: 'Heer Shah',
      organizerEmail: 'heer@example.com',
    };

    const res1 = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(primaryTripPayload),
    });
    const data1 = await res1.json();
    console.log(`Status: ${res1.status} (expected 201)`);
    if (res1.status !== 201 || !data1.trip?._id) {
      throw new Error('Test 1 failed: Could not create temporary test trip');
    }
    testTripId = data1.trip._id;
    const initialInviteCode = data1.trip.inviteCode;
    console.log(`Created primary trip (ID: ${testTripId}), Invite: ${initialInviteCode}`);

    // Create a second temporary trip to verify cross-trip isolation
    const resTrip2 = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Second Isolated Trip',
        destination: 'Jaipur',
        startDate: '2026-11-10',
        endDate: '2026-11-15',
      }),
    });
    const dataTrip2 = await resTrip2.json();
    testTrip2Id = dataTrip2.trip._id;
    console.log(`Created secondary trip for isolation tests (ID: ${testTrip2Id})`);

    // -------------------------------------------------------------
    // Test 2: Add an activity successfully
    // -------------------------------------------------------------
    console.log('\n[Test 2] Adding valid activity via POST /api/trips/:id/itinerary...');
    const actPayload1 = {
      title: 'Scuba Diving at Grand Island',
      date: '2026-11-11',
      startTime: '10:00',
      location: 'Grand Island Jetty',
      notes: 'Arrive 30 minutes early for safety briefing',
    };

    const res2 = await fetch(`${BASE_URL}/${testTripId}/itinerary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actPayload1),
    });
    const data2 = await res2.json();
    console.log(`Status: ${res2.status} (expected 201)`);
    if (res2.status !== 201 || !data2.success || !data2.activity?._id) {
      throw new Error(`Test 2 failed: Activity creation failed - ${data2.message}`);
    }
    firstActivityId = data2.activity._id;
    console.log(`Activity added (ID: ${firstActivityId}, Title: "${data2.activity.title}")`);

    // -------------------------------------------------------------
    // Test 3: Verify MongoDB persistence
    // -------------------------------------------------------------
    console.log('\n[Test 3] Verifying activity persistence directly in MongoDB...');
    const dbTrip = await Trip.findById(testTripId);
    if (!dbTrip || !dbTrip.itinerary || dbTrip.itinerary.length !== 1) {
      throw new Error('Test 3 failed: Activity was not persisted in MongoDB itinerary array');
    }
    const persistedAct = dbTrip.itinerary.id(firstActivityId);
    if (!persistedAct || persistedAct.title !== actPayload1.title || persistedAct.startTime !== '10:00') {
      throw new Error('Test 3 failed: Persisted activity fields mismatch in MongoDB');
    }
    console.log(`Verified in MongoDB: "${persistedAct.title}" on ${persistedAct.date.toISOString().slice(0, 10)} at ${persistedAct.startTime}`);

    // -------------------------------------------------------------
    // Test 4: Reject missing title
    // -------------------------------------------------------------
    console.log('\n[Test 4] Testing rejection of missing activity title...');
    const res4 = await fetch(`${BASE_URL}/${testTripId}/itinerary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: '2026-11-11', title: '   ' }),
    });
    const data4 = await res4.json();
    console.log(`Status: ${res4.status} (expected 400) - Message: ${data4.message}`);
    if (res4.status !== 400 || data4.success !== false) {
      throw new Error('Test 4 failed: Missing title was not rejected with 400');
    }

    // -------------------------------------------------------------
    // Test 5: Reject missing date
    // -------------------------------------------------------------
    console.log('\n[Test 5] Testing rejection of missing activity date...');
    const res5 = await fetch(`${BASE_URL}/${testTripId}/itinerary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Sunset Walk' }),
    });
    const data5 = await res5.json();
    console.log(`Status: ${res5.status} (expected 400) - Message: ${data5.message}`);
    if (res5.status !== 400 || data5.success !== false) {
      throw new Error('Test 5 failed: Missing date was not rejected with 400');
    }

    // -------------------------------------------------------------
    // Test 6: Reject invalid date
    // -------------------------------------------------------------
    console.log('\n[Test 6] Testing rejection of invalid date string...');
    const res6 = await fetch(`${BASE_URL}/${testTripId}/itinerary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Sunset Walk', date: 'invalid-date-string' }),
    });
    const data6 = await res6.json();
    console.log(`Status: ${res6.status} (expected 400) - Message: ${data6.message}`);
    if (res6.status !== 400 || data6.success !== false) {
      throw new Error('Test 6 failed: Malformed date was not rejected with 400');
    }

    // -------------------------------------------------------------
    // Test 7: Reject dates before trip start
    // -------------------------------------------------------------
    console.log('\n[Test 7] Testing rejection of date earlier than trip start (2026-11-09 < 2026-11-10)...');
    const res7 = await fetch(`${BASE_URL}/${testTripId}/itinerary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Early Beach Visit', date: '2026-11-09' }),
    });
    const data7 = await res7.json();
    console.log(`Status: ${res7.status} (expected 400) - Message: ${data7.message}`);
    if (res7.status !== 400 || !data7.message.includes('earlier than trip start')) {
      throw new Error('Test 7 failed: Date before trip start was not rejected with 400');
    }

    // -------------------------------------------------------------
    // Test 8: Reject dates after trip end
    // -------------------------------------------------------------
    console.log('\n[Test 8] Testing rejection of date later than trip end (2026-11-16 > 2026-11-15)...');
    const res8 = await fetch(`${BASE_URL}/${testTripId}/itinerary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Late Beach Visit', date: '2026-11-16' }),
    });
    const data8 = await res8.json();
    console.log(`Status: ${res8.status} (expected 400) - Message: ${data8.message}`);
    if (res8.status !== 400 || !data8.message.includes('later than trip end')) {
      throw new Error('Test 8 failed: Date after trip end was not rejected with 400');
    }

    // -------------------------------------------------------------
    // Test 9 & 10: Retrieve activities and verify chronological ordering
    // -------------------------------------------------------------
    console.log('\n[Test 9 & 10] Adding multiple activities with different times and dates to test ordering...');
    // Activity on Day 2 (Nov 11) - Evening Sunset Cruise at 17:30
    await fetch(`${BASE_URL}/${testTripId}/itinerary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Sunset Cruise', date: '2026-11-11', startTime: '17:30' }),
    });

    // Activity on Day 2 (Nov 11) - Early Morning Yoga at 07:00
    await fetch(`${BASE_URL}/${testTripId}/itinerary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Morning Yoga', date: '2026-11-11', startTime: '07:00' }),
    });

    // Activity on Day 2 (Nov 11) - Untimed Beach Stroll (empty startTime)
    await fetch(`${BASE_URL}/${testTripId}/itinerary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Beach Stroll', date: '2026-11-11' }),
    });

    // Activity on Day 3 (Nov 12) - Old Goa Churches
    await fetch(`${BASE_URL}/${testTripId}/itinerary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Old Goa Heritage Walk', date: '2026-11-12', startTime: '11:00' }),
    });

    console.log('\nRetrieving itinerary via GET /api/trips/:id/itinerary...');
    const res9 = await fetch(`${BASE_URL}/${testTripId}/itinerary`);
    const data9 = await res9.json();
    console.log(`Status: ${res9.status} (expected 200), Items count: ${data9.count}`);
    if (res9.status !== 200 || data9.count !== 5) {
      throw new Error(`Test 9 failed: Expected 5 activities, received ${data9.count}`);
    }

    console.log('Chronological order returned:');
    data9.itinerary.forEach((act, idx) => {
      console.log(`  ${idx + 1}. [${act.date.slice(0, 10)}] ${act.startTime || 'Untimed'} - ${act.title}`);
    });

    // Verify ordering on Nov 11: 07:00 -> 10:00 -> 17:30 -> Untimed Beach Stroll
    const nov11Acts = data9.itinerary.filter((a) => a.date.slice(0, 10) === '2026-11-11');
    if (
      nov11Acts[0].title !== 'Morning Yoga' ||
      nov11Acts[1].title !== 'Scuba Diving at Grand Island' ||
      nov11Acts[2].title !== 'Sunset Cruise' ||
      nov11Acts[3].title !== 'Beach Stroll'
    ) {
      throw new Error('Test 10 failed: Chronological ordering of activities was incorrect');
    }
    console.log('Chronological order verified: earliest time first, untimed activities at the end of the day.');

    // -------------------------------------------------------------
    // Test 11 & 12: Update an activity successfully and verify persistence
    // -------------------------------------------------------------
    console.log('\n[Test 11 & 12] Updating activity via PUT /api/trips/:id/itinerary/:activityId...');
    const updatePayload = {
      title: 'Scuba Diving & Coral Reef Tour',
      startTime: '09:30',
      location: 'Grande Island Marine Sanctuary',
      notes: 'Includes underwater photography package',
    };

    const res11 = await fetch(`${BASE_URL}/${testTripId}/itinerary/${firstActivityId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload),
    });
    const data11 = await res11.json();
    console.log(`Status: ${res11.status} (expected 200) - Message: ${data11.message}`);
    if (res11.status !== 200 || !data11.success) {
      throw new Error('Test 11 failed: Activity update failed with non-200');
    }

    console.log('Verifying updated data directly in MongoDB...');
    const dbTripAfterUpdate = await Trip.findById(testTripId);
    const updatedAct = dbTripAfterUpdate.itinerary.id(firstActivityId);
    if (
      updatedAct.title !== updatePayload.title ||
      updatedAct.startTime !== '09:30' ||
      updatedAct.location !== updatePayload.location
    ) {
      throw new Error('Test 12 failed: Updated fields were not persisted in MongoDB');
    }
    console.log(`Verified in MongoDB: "${updatedAct.title}" at ${updatedAct.startTime} at "${updatedAct.location}"`);

    // -------------------------------------------------------------
    // Test 13: Reject an invalid activity ID
    // -------------------------------------------------------------
    console.log('\n[Test 13] Testing update with malformed activity ID...');
    const res13 = await fetch(`${BASE_URL}/${testTripId}/itinerary/malformed-id-123`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Title' }),
    });
    const data13 = await res13.json();
    console.log(`Status: ${res13.status} (expected 400) - Message: ${data13.message}`);
    if (res13.status !== 400 || !data13.message.includes('Invalid activity ID format')) {
      throw new Error('Test 13 failed: Malformed activity ID was not rejected with 400');
    }

    // -------------------------------------------------------------
    // Test 14: Reject an activity belonging to another trip
    // -------------------------------------------------------------
    console.log('\n[Test 14] Testing cross-trip isolation (accessing trip 1 activity via trip 2)...');
    const res14 = await fetch(`${BASE_URL}/${testTrip2Id}/itinerary/${firstActivityId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Illegitimate Update' }),
    });
    const data14 = await res14.json();
    console.log(`Status: ${res14.status} (expected 404) - Message: ${data14.message}`);
    if (res14.status !== 404 || !data14.message.includes('Activity not found in this trip')) {
      throw new Error('Test 14 failed: Cross-trip activity access was not rejected with 404');
    }

    // -------------------------------------------------------------
    // Test 15 & 16: Delete an activity successfully and verify removal
    // -------------------------------------------------------------
    console.log('\n[Test 15 & 16] Deleting activity via DELETE /api/trips/:id/itinerary/:activityId...');
    const res15 = await fetch(`${BASE_URL}/${testTripId}/itinerary/${firstActivityId}`, {
      method: 'DELETE',
    });
    const data15 = await res15.json();
    console.log(`Status: ${res15.status} (expected 200) - Message: ${data15.message}`);
    if (res15.status !== 200 || !data15.success) {
      throw new Error('Test 15 failed: Activity deletion failed');
    }

    console.log('Verifying activity removal directly in MongoDB...');
    const dbTripAfterDelete = await Trip.findById(testTripId);
    const deletedAct = dbTripAfterDelete.itinerary.id(firstActivityId);
    if (deletedAct !== null) {
      throw new Error('Test 16 failed: Activity still found in MongoDB after deletion');
    }
    console.log(`Verified in MongoDB: Activity removed. Remaining count: ${dbTripAfterDelete.itinerary.length} (expected 4)`);

    // -------------------------------------------------------------
    // Test 17: Verify participant records and inviteCode remain intact
    // -------------------------------------------------------------
    console.log('\n[Test 17] Verifying participant records and inviteCode remain intact...');
    console.log(`Invite code: ${dbTripAfterDelete.inviteCode} (original: ${initialInviteCode})`);
    console.log(`Participants count: ${dbTripAfterDelete.participants.length} (original: 1)`);
    if (dbTripAfterDelete.inviteCode !== initialInviteCode) {
      throw new Error('Test 17 failed: inviteCode was mutated during itinerary operations');
    }
    if (dbTripAfterDelete.participants.length !== 1 || dbTripAfterDelete.participants[0].name !== 'Heer Shah') {
      throw new Error('Test 17 failed: Participant records were affected during itinerary operations');
    }
    console.log('Integrity verified: Participants and inviteCode remain 100% intact.');

    console.log('\n========================================================================');
    console.log('   ALL 17 ITINERARY PERSISTENCE TESTS PASSED SUCCESSFULLY!              ');
    console.log('========================================================================');
  } finally {
    // Cleanup temporary test trips
    if (testTripId) {
      await Trip.findByIdAndDelete(testTripId);
      console.log(`Cleaned up temporary primary test trip (${testTripId}).`);
    }
    if (testTrip2Id) {
      await Trip.findByIdAndDelete(testTrip2Id);
      console.log(`Cleaned up temporary secondary test trip (${testTrip2Id}).`);
    }

    await mongoose.connection.close();
    server.close();
  }
}

runItineraryPersistenceTests().catch((err) => {
  console.error('\n❌ Test execution failed with error:', err);
  process.exit(1);
});
