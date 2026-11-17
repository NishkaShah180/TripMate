import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import Trip from './src/models/Trip.js';

async function runExpenseManagementTests() {
  console.log('========================================================================');
  console.log('   MODULE 2 (PART 3): EXPENSE CREATION, EDITING & DELETION (HEER SHAH)  ');
  console.log('========================================================================');

  await connectDB();
  const PORT = 5005;
  const server = app.listen(PORT);
  await new Promise((resolve) => setTimeout(resolve, 300));

  const BASE_URL = `http://localhost:${PORT}/api/trips`;
  let testTripId = null;
  let testParticipantId = null;
  let expense1Id = null;
  let expense2Id = null;

  try {
    // -------------------------------------------------------------
    // Setup: Create an initial trip with an organizer participant
    // -------------------------------------------------------------
    console.log('\n[Setup] Creating initial test trip with organizer participant in MongoDB...');
    const tripPayload = {
      name: 'Udaipur Lakeside Retreat',
      destination: 'Udaipur, Rajasthan',
      startDate: '2026-12-15',
      endDate: '2026-12-18',
      description: 'Lakeside palace tour and cultural exploration',
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
    testParticipantId = initialOrganizer._id;
    console.log(`Trip created (ID: ${testTripId}) with organizer: ${initialOrganizer.name} (${testParticipantId})`);

    // -------------------------------------------------------------
    // Test 1: Retrieve initial empty expenses
    // -------------------------------------------------------------
    console.log('\n[Test 1] Retrieving expenses via GET /api/trips/:id/expenses...');
    const res1 = await fetch(`${BASE_URL}/${testTripId}/expenses`);
    const data1 = await res1.json();
    console.log(`Status: ${res1.status} (expected 200)`);
    console.log(`Counts: Total Expenses = ${data1.count}, Total Amount = ${data1.totalAmount}`);

    if (res1.status !== 200 || !data1.success || data1.count !== 0 || data1.totalAmount !== 0) {
      throw new Error('Test 1 failed: Initial expenses should be empty');
    }

    // -------------------------------------------------------------
    // Test 2: Add first expense via POST /api/trips/:id/expenses
    // -------------------------------------------------------------
    console.log('\n[Test 2] Adding first expense (Dinner at Ambrai Restaurant) via POST...');
    const expensePayload1 = {
      title: 'Dinner at Ambrai Restaurant',
      amount: 2450.50,
      category: 'Food',
      date: '2026-12-15',
      paidBy: testParticipantId,
      notes: 'Lakeside dinner with view of City Palace',
    };

    const res2 = await fetch(`${BASE_URL}/${testTripId}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expensePayload1),
    });
    const data2 = await res2.json();
    console.log(`Status: ${res2.status} (expected 201)`);
    console.log(`Message: ${data2.message}`);
    console.log(`Created Expense: "${data2.expense?.title}", Amount: ₹${data2.expense?.amount}, Paid By: ${data2.expense?.paidByName}`);

    if (res2.status !== 201 || !data2.success || !data2.expense?._id) {
      throw new Error(`Test 2 failed: Could not add expense: ${data2.message}`);
    }
    expense1Id = data2.expense._id;

    if (data2.expense.amount !== 2450.50 || data2.expense.category !== 'Food' || data2.expense.paidByName !== 'Heer Shah') {
      throw new Error('Test 2 failed: Expense fields did not match expected values');
    }

    // -------------------------------------------------------------
    // Test 3: Verify expense persistence directly in MongoDB
    // -------------------------------------------------------------
    console.log('\n[Test 3] Verifying expense persistence directly in MongoDB...');
    const dbTripAfterAdd = await Trip.findById(testTripId);
    const persistedExpense1 = dbTripAfterAdd.expenses.id(expense1Id);

    if (!persistedExpense1) {
      throw new Error('Test 3 failed: Expense not found in MongoDB document');
    }
    console.log(`Found in MongoDB: "${persistedExpense1.title}", Category: ${persistedExpense1.category}, Amount: ₹${persistedExpense1.amount}`);

    // -------------------------------------------------------------
    // Test 4: Add second expense with different category (Transport)
    // -------------------------------------------------------------
    console.log('\n[Test 4] Adding second expense (Airport Cab) via POST...');
    const expensePayload2 = {
      title: 'Airport Cab to Lakeside Hotel',
      amount: 850,
      category: 'Transport',
      date: '2026-12-15',
      paidByName: 'Nishka Shah',
      notes: 'Prepaid prepaid taxi from Udaipur airport',
    };

    const res4 = await fetch(`${BASE_URL}/${testTripId}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expensePayload2),
    });
    const data4 = await res4.json();
    console.log(`Status: ${res4.status} (expected 201)`);
    console.log(`Created Expense: "${data4.expense?.title}", Amount: ₹${data4.expense?.amount}`);

    if (res4.status !== 201 || !data4.success || !data4.expense?._id) {
      throw new Error(`Test 4 failed: Could not add second expense`);
    }
    expense2Id = data4.expense._id;

    // -------------------------------------------------------------
    // Test 5: Verify GET expenses returns both items and correct total
    // -------------------------------------------------------------
    console.log('\n[Test 5] Fetching all expenses via GET /api/trips/:id/expenses...');
    const res5 = await fetch(`${BASE_URL}/${testTripId}/expenses`);
    const data5 = await res5.json();
    console.log(`Status: ${res5.status} (expected 200)`);
    console.log(`Total Count: ${data5.count} (expected 2), Total Amount: ₹${data5.totalAmount} (expected ₹3300.5)`);

    if (res5.status !== 200 || data5.count !== 2 || data5.totalAmount !== 3300.5) {
      throw new Error('Test 5 failed: GET expenses did not return expected count or sum');
    }

    // -------------------------------------------------------------
    // Test 6: Missing title validation
    // -------------------------------------------------------------
    console.log('\n[Test 6] Testing missing expense title validation...');
    const res6 = await fetch(`${BASE_URL}/${testTripId}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 500, category: 'Food' }),
    });
    const data6 = await res6.json();
    console.log(`Status: ${res6.status} (expected 400)`);
    console.log(`Response message: ${data6.message}`);

    if (res6.status !== 400 || !data6.message.includes('title is required')) {
      throw new Error('Test 6 failed: Missing title should return 400');
    }

    // -------------------------------------------------------------
    // Test 7: Missing / zero / negative amount validation
    // -------------------------------------------------------------
    console.log('\n[Test 7] Testing invalid amount validation (amount = -50 and amount = 0)...');
    const res7a = await fetch(`${BASE_URL}/${testTripId}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Invalid Expense', amount: -50 }),
    });
    const data7a = await res7a.json();
    console.log(`Negative amount status: ${res7a.status} (expected 400) - ${data7a.message}`);

    const res7b = await fetch(`${BASE_URL}/${testTripId}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Invalid Expense', amount: 0 }),
    });
    const data7b = await res7b.json();
    console.log(`Zero amount status: ${res7b.status} (expected 400) - ${data7b.message}`);

    if (res7a.status !== 400 || res7b.status !== 400) {
      throw new Error('Test 7 failed: Invalid amount must be rejected with 400');
    }

    // -------------------------------------------------------------
    // Test 8: Invalid category validation
    // -------------------------------------------------------------
    console.log('\n[Test 8] Testing invalid category validation (category = "LuxurySpa")...');
    const res8 = await fetch(`${BASE_URL}/${testTripId}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Spa', amount: 1200, category: 'LuxurySpa' }),
    });
    const data8 = await res8.json();
    console.log(`Status: ${res8.status} (expected 400) - ${data8.message}`);

    if (res8.status !== 400 || !data8.message.includes('Category must be one of')) {
      throw new Error('Test 8 failed: Invalid category should return 400');
    }

    // -------------------------------------------------------------
    // Test 9: Malformed trip ID validation
    // -------------------------------------------------------------
    console.log('\n[Test 9] Testing malformed trip ID validation...');
    const res9 = await fetch(`${BASE_URL}/invalid-trip-id-123/expenses`);
    const data9 = await res9.json();
    console.log(`Status: ${res9.status} (expected 400) - ${data9.message}`);

    if (res9.status !== 400 || !data9.message.includes('Invalid trip ID format')) {
      throw new Error('Test 9 failed: Malformed trip ID should return 400');
    }

    // -------------------------------------------------------------
    // Test 10: Update existing expense via PUT
    // -------------------------------------------------------------
    console.log('\n[Test 10] Updating expense 1 via PUT /api/trips/:id/expenses/:expenseId...');
    const updatePayload = {
      title: 'Grand Buffet Dinner at Ambrai',
      amount: 2800,
      notes: 'Added dessert and traditional live music charges',
    };

    const res10 = await fetch(`${BASE_URL}/${testTripId}/expenses/${expense1Id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload),
    });
    const data10 = await res10.json();
    console.log(`Status: ${res10.status} (expected 200)`);
    console.log(`Updated Title: "${data10.expense?.title}", New Amount: ₹${data10.expense?.amount}`);

    if (res10.status !== 200 || !data10.success || data10.expense?.amount !== 2800) {
      throw new Error('Test 10 failed: Could not update expense');
    }

    // -------------------------------------------------------------
    // Test 11: Verify update persistence directly in MongoDB
    // -------------------------------------------------------------
    console.log('\n[Test 11] Verifying update persistence directly in MongoDB...');
    const dbTripAfterUpdate = await Trip.findById(testTripId);
    const updatedInDb = dbTripAfterUpdate.expenses.id(expense1Id);

    if (!updatedInDb || updatedInDb.amount !== 2800 || updatedInDb.title !== 'Grand Buffet Dinner at Ambrai') {
      throw new Error('Test 11 failed: Expense updates not persisted to MongoDB');
    }
    console.log(`Verified in MongoDB: Title="${updatedInDb.title}", Amount=₹${updatedInDb.amount}`);

    // -------------------------------------------------------------
    // Test 12: Delete an expense via DELETE
    // -------------------------------------------------------------
    console.log('\n[Test 12] Deleting expense 2 (Airport Cab) via DELETE...');
    const res12 = await fetch(`${BASE_URL}/${testTripId}/expenses/${expense2Id}`, {
      method: 'DELETE',
    });
    const data12 = await res12.json();
    console.log(`Status: ${res12.status} (expected 200)`);
    console.log(`Response message: ${data12.message}`);

    if (res12.status !== 200 || !data12.success) {
      throw new Error('Test 12 failed: Could not delete expense');
    }

    // -------------------------------------------------------------
    // Test 13: Verify deletion persistence directly in MongoDB
    // -------------------------------------------------------------
    console.log('\n[Test 13] Verifying deletion persistence directly in MongoDB...');
    const dbTripAfterDelete = await Trip.findById(testTripId);
    const deletedInDb = dbTripAfterDelete.expenses.id(expense2Id);

    if (deletedInDb !== null) {
      throw new Error('Test 13 failed: Deleted expense still exists in MongoDB');
    }
    if (dbTripAfterDelete.expenses.length !== 1) {
      throw new Error(`Test 13 failed: Expected 1 remaining expense in MongoDB, found ${dbTripAfterDelete.expenses.length}`);
    }
    console.log(`Verified in MongoDB: Expense deleted. Remaining count = ${dbTripAfterDelete.expenses.length} (expected 1)`);

    // -------------------------------------------------------------
    // Test 14: Delete non-existent expense ID
    // -------------------------------------------------------------
    console.log('\n[Test 14] Testing deletion of non-existent expense ID...');
    const fakeExpenseId = new mongoose.Types.ObjectId();
    const res14 = await fetch(`${BASE_URL}/${testTripId}/expenses/${fakeExpenseId}`, {
      method: 'DELETE',
    });
    const data14 = await res14.json();
    console.log(`Status: ${res14.status} (expected 404) - ${data14.message}`);

    if (res14.status !== 404 || !data14.message.includes('Expense not found')) {
      throw new Error('Test 14 failed: Non-existent expense should return 404');
    }

    // -------------------------------------------------------------
    // Test 15: Malformed expense ID validation
    // -------------------------------------------------------------
    console.log('\n[Test 15] Testing malformed expense ID validation...');
    const res15 = await fetch(`${BASE_URL}/${testTripId}/expenses/bad-expense-id`, {
      method: 'DELETE',
    });
    const data15 = await res15.json();
    console.log(`Status: ${res15.status} (expected 400) - ${data15.message}`);

    if (res15.status !== 400 || !data15.message.includes('Invalid expense ID format')) {
      throw new Error('Test 15 failed: Malformed expense ID should return 400');
    }

    console.log('\n========================================================================');
    console.log('   ALL 15 EXPENSE MANAGEMENT TESTS PASSED SUCCESSFULLY!                 ');
    console.log('========================================================================\n');
  } finally {
    if (testTripId) {
      await Trip.findByIdAndDelete(testTripId);
      console.log(`Cleaned up temporary test trip (${testTripId}).`);
    }
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
  }
}

runExpenseManagementTests().catch((err) => {
  console.error('\n❌ Expense Management Test Suite failed:', err);
  process.exit(1);
});
