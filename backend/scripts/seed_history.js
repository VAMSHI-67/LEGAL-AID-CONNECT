const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const User = require('../models/User');
const Case = require('../models/Case');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI missing in backend/.env');
  process.exit(1);
}

// Configuration
const TARGET_CASE_COUNT = 600; // Generate enough data for ML
const CATEGORIES = [
  'Civil Law', 'Criminal Law', 'Corporate Law', 'Family Law',
  'Property Law', 'Constitutional Law', 'Tax Law', 'Intellectual Property',
  'Labor Law', 'Environmental Law', 'Banking Law', 'Insurance Law',
  'Real Estate Law', 'Immigration Law', 'Consumer Law', 'Cyber Law'
];
const CITIES = ['Hyderabad', 'Mumbai', 'Delhi', 'Chennai', 'Bengaluru', 'Pune', 'Kolkata'];

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const generateHistory = async () => {
  await connect();

  try {
    // 1. Fetch Users
    const clients = await User.find({ role: 'client' });
    const lawyers = await User.find({ role: 'lawyer' });

    if (clients.length === 0 || lawyers.length === 0) {
      console.error('❌ Need at least one client and one lawyer. Run seed.js first.');
      process.exit(1);
    }

    console.log(`📊 Found ${clients.length} clients and ${lawyers.length} lawyers.`);
    console.log(`🚀 Generating ${TARGET_CASE_COUNT} historical cases...`);

    const casesToInsert = [];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 12); // Data from last year

    for (let i = 0; i < TARGET_CASE_COUNT; i++) {
      const client = getRandom(clients);
      const lawyer = getRandom(lawyers); // Random assignment for initial noise
      const category = getRandom(CATEGORIES);
      const city = getRandom(CITIES);
      
      const createdDate = getRandomDate(startDate, new Date());
      const assignedDate = new Date(createdDate.getTime() + getRandomInt(1, 48) * 60 * 60 * 1000); // 1-48 hours later
      const completedDate = new Date(assignedDate.getTime() + getRandomInt(5, 90) * 24 * 60 * 60 * 1000); // 5-90 days later

      // Simulate Match Quality Factors
      const isDomainMatch = lawyer.specialization.includes(category);
      const isLocationMatch = lawyer.location.district === city; // Simplified
      const expScore = Math.min(lawyer.experience / 20, 1);
      
      // Determine Outcome (Probabilistic based on match quality)
      // Good match = higher chance of success
      let successProb = 0.3; 
      if (isDomainMatch) successProb += 0.4;
      if (isLocationMatch) successProb += 0.1;
      successProb += (expScore * 0.1);
      
      const isSuccess = Math.random() < successProb;
      const status = isSuccess ? 'completed' : (Math.random() > 0.5 ? 'cancelled' : 'completed'); // Some unsuccessful are still 'completed' but with bad rating
      
      // Rating Logic
      let clientRatingVal = 3;
      if (isSuccess) {
        clientRatingVal = getRandomInt(4, 5);
      } else {
        clientRatingVal = getRandomInt(1, 3);
      }

      const newCase = {
        title: `${category} Case - ${getRandomInt(1000, 9999)}`,
        description: `Legal assistance required for ${category} matter in ${city}.`,
        category: category,
        clientId: client._id,
        lawyerId: lawyer._id,
        status: status,
        priority: getRandom(['medium', 'high', 'urgent']),
        location: { state: lawyer.location.state || 'StateA', district: city },
        budget: { min: 5000, max: 50000, currency: 'INR' },
        tags: [category, 'Legal Aid'],
        
        // Timeline & Assignment
        createdAt: createdDate,
        updatedAt: completedDate,
        assignedAt: assignedDate,
        startedAt: assignedDate,
        completedAt: status === 'completed' ? completedDate : undefined,
        
        // Match Info (Simulating simple matching)
        matchInfo: {
          score: Math.floor(successProb * 100),
          reasons: isDomainMatch ? ['Specialization Match'] : [],
          assignedAt: assignedDate
        },

        // Outcome & Ratings
        clientRating: status === 'completed' ? {
          rating: clientRatingVal,
          review: isSuccess ? 'Excellent service!' : 'Not satisfied.',
          reviewDate: completedDate
        } : undefined,
        
        // Outcome field
        outcome: status === 'completed' ? {
            status: isSuccess ? 'successful' : 'unsuccessful',
            resolutionDate: completedDate
        } : undefined
      };

      casesToInsert.push(newCase);
    }

    // Insert properly to trigger middleware if using save(), but insertMany is faster
    // We lose middleware (timestamps) with insertMany, but we manually set them above.
    await Case.insertMany(casesToInsert);
    
    console.log(`✅ Successfully inserted ${casesToInsert.length} cases.`);
    
    // Update Lawyer Stats (Approximate)
    console.log('🔄 Updating lawyer stats...');
    for (const lawyer of lawyers) {
        const caseCount = casesToInsert.filter(c => c.lawyerId.toString() === lawyer._id.toString()).length;
        const successCount = casesToInsert.filter(c => c.lawyerId.toString() === lawyer._id.toString() && c.outcome?.status === 'successful').length;
        if(caseCount > 0) {
            await User.findByIdAndUpdate(lawyer._id, {
                $inc: { totalCases: caseCount, completedCases: successCount }
            });
        }
    }
    console.log('✅ Lawyer stats updated.');

  } catch (error) {
    console.error('❌ Error generating history:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected.');
    process.exit(0);
  }
};

generateHistory();
