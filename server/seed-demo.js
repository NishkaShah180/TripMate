import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Trip from './src/models/Trip.js';

dotenv.config();

// Production guard: ensure demo data operations can never run in production
if (process.env.NODE_ENV === 'production') {
  console.error('ERROR: Demo seeding and cleanup commands are strictly disabled in production environments.');
  process.exit(1);
}

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tripmate';

/**
 * Creates a UTC Date normalized to midnight at offset days from today.
 */
function addDaysFromToday(days) {
  const now = new Date();
  const target = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days, 0, 0, 0, 0));
  return target;
}

const DEMO_TRIPS_CONFIG = [
  {
    name: 'Rajasthan Heritage Escape',
    destination: 'Jaipur',
    startOffset: 7,
    endOffset: 11,
    description: 'Explore majestic Amber Fort, royal palaces, ornate architecture, and lively traditional bazaars across the historic Pink City.',
    organizer: {
      name: 'Aarav Sharma',
      email: 'aarav.sharma@example.com',
    },
    member: {
      name: 'Priya Patel',
      email: 'priya.patel@example.com',
    },
    activities: [
      {
        dayOffset: 7,
        title: 'Hawa Mahal & Old City Walking Tour',
        startTime: '09:30',
        location: 'Hawa Mahal, Badi Choupad, Jaipur',
        notes: 'Morning photography of the iconic honeycomb facade followed by a walk through local artisan bazaars.',
      },
      {
        dayOffset: 8,
        title: 'Amber Fort & Sheesh Mahal Exploration',
        startTime: '10:00',
        location: 'Amer, Jaipur',
        notes: 'Guided exploration through the mirror palace courtyards and Maota Lake panoramic viewpoints.',
      },
      {
        dayOffset: 9,
        title: 'Sunset at Nahargarh Fort',
        startTime: '17:00',
        location: 'Nahargarh Fort, Aravalli Hills',
        notes: 'Take in panoramic dusk views over the illuminated city of Jaipur.',
      },
    ],
  },
  {
    name: 'Goa Beach Getaway',
    destination: 'Goa',
    startOffset: 14,
    endOffset: 18,
    description: 'Sun, sand, and coastal relaxation featuring golden sandy shores, vibrant coastal culture, and relaxing sunsets.',
    organizer: {
      name: 'Pooja Mehta',
      email: 'pooja.mehta@example.com',
    },
    member: {
      name: 'Vikram Singhania',
      email: 'vikram.s@example.com',
    },
    activities: [
      {
        dayOffset: 14,
        title: 'Sunset Stroll & Coastal Dinner at Anjuna',
        startTime: '17:30',
        location: 'Anjuna Beach, North Goa',
        notes: 'Relax at a seaside shack and enjoy sunset acoustics with authentic Goan fish curry.',
      },
      {
        dayOffset: 15,
        title: 'Scuba Diving & Coral Safari at Grand Island',
        startTime: '08:30',
        location: 'Grand Island, Goa',
        notes: 'Morning boat excursion with certified instructors to explore vibrant reef life.',
      },
      {
        dayOffset: 16,
        title: 'Old Goa Heritage Churches & Fontainhas Latin Quarter',
        startTime: '10:00',
        location: 'Fontainhas, Panaji, Goa',
        notes: 'Explore colourful Portuguese architecture and taste traditional bebinca at a heritage bakery.',
      },
    ],
  },
  {
    name: 'Mountain Escape',
    destination: 'Manali',
    startOffset: 21,
    endOffset: 26,
    description: 'Picturesque valley retreat nestled in the Himalayas known for snow peaks, alpine pine forests, and mountain passes.',
    organizer: {
      name: 'Rohan Verma',
      email: 'rohan.verma@example.com',
    },
    member: {
      name: 'Ananya Iyer',
      email: 'ananya.iyer@example.com',
    },
    activities: [
      {
        dayOffset: 21,
        title: 'Old Manali Cafe Trail & Hadimba Temple',
        startTime: '11:00',
        location: 'Hadimba Temple, Manali',
        notes: 'Tranquil walk through towering deodar cedar trees and visit local handicraft stalls.',
      },
      {
        dayOffset: 22,
        title: 'Solang Valley Adventure Sports',
        startTime: '09:00',
        location: 'Solang Valley, Himachal Pradesh',
        notes: 'Paragliding and mountain zorbing surrounded by snow-capped peaks.',
      },
      {
        dayOffset: 24,
        title: 'Jogini Waterfall Forest Hike',
        startTime: '14:00',
        location: 'Vashisht Village, Manali',
        notes: 'Scenic 2-hour forest trek leading to the cascading mountain waterfall.',
      },
    ],
  },
];

async function run() {
  const isClear = process.argv.includes('--clear');

  console.log(`Connecting to MongoDB at: ${mongoUri.replace(/:([^:@]{3,})@/, ':***@')}...`);
  await mongoose.connect(mongoUri);

  try {
    if (isClear) {
      console.log('Running safe demo cleanup (removing only records flagged with isDemo: true)...');
      const result = await Trip.deleteMany({ isDemo: true });
      console.log(`Success: removed ${result.deletedCount} demo trip record(s).`);
      console.log('All user-created trips have been safely preserved.');
      return;
    }

    console.log('Starting idempotent demo trip seeding...');
    let createdCount = 0;
    let skippedCount = 0;

    for (const conf of DEMO_TRIPS_CONFIG) {
      // Check if demo trip already exists by name + isDemo flag
      const existing = await Trip.findOne({ isDemo: true, name: conf.name });
      if (existing) {
        console.log(`[SKIP] Demo trip "${conf.name}" already exists (${existing.inviteCode}).`);
        skippedCount++;
        continue;
      }

      const startDate = addDaysFromToday(conf.startOffset);
      const endDate = addDaysFromToday(conf.endOffset);

      const participants = [
        {
          name: conf.organizer.name,
          email: conf.organizer.email,
          role: 'organizer',
          status: 'confirmed',
        },
        {
          name: conf.member.name,
          email: conf.member.email,
          role: 'member',
          status: 'confirmed',
        },
      ];

      const itinerary = conf.activities.map((act) => ({
        title: act.title,
        date: addDaysFromToday(act.dayOffset),
        startTime: act.startTime,
        location: act.location,
        notes: act.notes,
      }));

      const newTrip = new Trip({
        name: conf.name,
        destination: conf.destination,
        startDate,
        endDate,
        description: conf.description,
        isDemo: true,
        participants,
        itinerary,
      });

      // Save using standard Mongoose model to trigger validations and pre-save hooks
      await newTrip.save();
      console.log(`[CREATED] Demo trip "${newTrip.name}" | Code: ${newTrip.inviteCode} | Activities: ${newTrip.itinerary.length}`);
      createdCount++;
    }

    console.log(`\nDemo seeding finished: ${createdCount} created, ${skippedCount} skipped.`);
    console.log('Note: Seeded demo trips are shared within this database instance for local development and demonstration.');
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed.');
  }
}

run().catch((err) => {
  console.error('Fatal error during demo seed operation:', err);
  process.exit(1);
});
