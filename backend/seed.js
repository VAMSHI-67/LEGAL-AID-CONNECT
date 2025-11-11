/*
 Seed script to create baseline users for parallel role testing:
 - Admin: admin@example.com / Admin123!
 - Client: client@example.com / Client123!
 - Lawyer: lawyer@example.com / Lawyer123!

 Safe to re-run; it will upsert by email.
*/

const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config({ path: path.join(__dirname, '.env') });

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI missing in backend/.env');
  process.exit(1);
}

async function connect() {
  await mongoose.connect(process.env.MONGODB_URI, { autoIndex: true });
}

async function upsertUser(data) {
  const existing = await User.findOne({ email: data.email.toLowerCase() });
  if (existing) {
    console.log(`↺ Updating ${data.role} (${data.email})`);
    Object.assign(existing, data);
    // Only set password if changed (will trigger pre-save hashing)
    if (data.password) existing.password = data.password;
    await existing.save();
    return existing;
  } else {
    console.log(`➕ Creating ${data.role} (${data.email})`);
    const user = new User(data);
    try {
      await user.save();
      return user;
    } catch (e) {
      if (e.code === 11000 && e.keyPattern && e.keyPattern.barNumber && data.role === 'lawyer') {
        console.warn(`⚠️ Duplicate barNumber detected for lawyer ${data.email}, generating fallback value.`);
        user.barNumber = 'BR-' + Math.floor(Math.random() * 1e9);
        await user.save();
        return user;
      }
      throw e;
    }
  }
}

async function run() {
  try {
    await connect();
    console.log('✅ Connected to MongoDB');

    const users = [
      {
        name: 'System Admin',
        email: 'admin@example.com',
        password: 'Admin123!',
        role: 'admin',
        isVerified: true,
        permissions: ['manage_users','view_analytics','manage_cases']
      },
      {
        name: 'Test Client',
        email: 'client@example.com',
        password: 'Client123!',
        role: 'client',
        isVerified: true,
        location: { state: 'StateA', district: 'District1' }
      },
      {
        name: 'Test Lawyer',
        email: 'lawyer@example.com',
        password: 'Lawyer123!',
        role: 'lawyer',
        isVerified: true,
        barNumber: 'BR-123456',
        barState: 'StateA',
        specialization: ['Civil Law','Corporate Law'],
        experience: 7,
        languages: ['English'],
        availability: 'available',
        rating: 4.5,
        location: { state: 'StateA', district: 'District1' }
      }
    ];

    // Optionally seed a richer demo lawyer catalog (converted from legacy scripts/seedLawyers.js)
    if (process.env.SEED_DEMO_LAWYERS !== 'false') {
  const demoLawyersRaw = [
        { name: 'Alice Family', specialization: 'Family Law', city: 'Hyderabad', experience: 15, rating: 4.8, casesWon: 40, casesTotal: 50, available: true },
        { name: 'Bob Civil', specialization: 'Civil Law', city: 'Hyderabad', experience: 10, rating: 4.2, casesWon: 30, casesTotal: 40, available: true },
        { name: 'Charlie Cyber', specialization: 'Cyber Law', city: 'Bangalore', experience: 8, rating: 4.9, casesWon: 25, casesTotal: 30, available: true },
        { name: 'Dave Corporate', specialization: 'Corporate Law', city: 'Bangalore', experience: 12, rating: 4.7, casesWon: 35, casesTotal: 50, available: true },
        { name: 'Eve Family', specialization: 'Family Law', city: 'Hyderabad', experience: 40, rating: 4.0, casesWon: 50, casesTotal: 60, available: true },
        { name: 'Zara Family', specialization: 'Family Law', city: 'Hyderabad', experience: 10, rating: 5.0, casesWon: 20, casesTotal: 25, available: true },
        { name: 'Mohan Criminal', specialization: 'Criminal Law', city: 'Mumbai', experience: 25, rating: 4.3, casesWon: 60, casesTotal: 80, available: false },
        { name: 'Priya Tax', specialization: 'Tax Law', city: 'Delhi', experience: 5, rating: 3.8, casesWon: 10, casesTotal: 20, available: true },
        { name: 'Ravi Civil', specialization: 'Civil Law', city: 'Delhi', experience: 18, rating: 4.6, casesWon: 45, casesTotal: 60, available: true },
        { name: 'Sunil Corporate', specialization: 'Corporate Law', city: 'Mumbai', experience: 30, rating: 4.9, casesWon: 100, casesTotal: 120, available: true },
        { name: 'Anita Cyber', specialization: 'Cyber Law', city: 'Delhi', experience: 7, rating: 4.1, casesWon: 15, casesTotal: 25, available: false },
        { name: 'Deepa Family', specialization: 'Family Law', city: 'Mumbai', experience: 3, rating: 2.9, casesWon: 2, casesTotal: 10, available: true },
        { name: 'Vikram Criminal', specialization: 'Criminal Law', city: 'Bangalore', experience: 20, rating: 4.5, casesWon: 70, casesTotal: 90, available: true },
        { name: 'Suresh Tax', specialization: 'Tax Law', city: 'Hyderabad', experience: 12, rating: 3.5, casesWon: 18, casesTotal: 30, available: true },
        { name: 'Meera Civil', specialization: 'Civil Law', city: 'Mumbai', experience: 8, rating: 4.0, casesWon: 20, casesTotal: 35, available: false }
      ];

      const emailFromName = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '.') + '@demo.lawyer';
      let barCounter = 200000;
      demoLawyersRaw.forEach(l => {
        const specialization = l.specialization.endsWith(' Law') ? l.specialization : `${l.specialization}`;
        users.push({
          name: l.name,
          email: emailFromName(l.name),
          password: 'Lawyer123!',
          role: 'lawyer',
          isVerified: true,
          barNumber: 'BR-' + (barCounter++),
          barState: l.city + ' State',
          specialization: [specialization],
          experience: l.experience,
          languages: ['English'],
          availability: l.available ? 'available' : 'busy',
          rating: l.rating,
          totalCases: l.casesTotal,
          completedCases: l.casesWon,
          location: { state: l.city + ' State', district: l.city }
        });
      });
      console.log(`🧪 Including ${demoLawyersRaw.length} demo lawyers (override with SEED_DEMO_LAWYERS=false)`);
    } else {
      console.log('⏭️  Skipping demo lawyers (SEED_DEMO_LAWYERS=false)');
    }

    for (const u of users) {
      await upsertUser(u);
    }

    console.log('\n🎉 Seed complete. Login credentials:');
    console.log('Admin : admin@example.com / Admin123!');
    console.log('Client: client@example.com / Client123!');
    console.log('Lawyer: lawyer@example.com / Lawyer123!');
    console.log('Demo Lawyers (if seeded): *.@demo.lawyer / Lawyer123!');
  } catch (e) {
    console.error('Seed error:', e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
