const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const Case = require('../models/Case');
const User = require('../models/User');
const MatchEvent = require('../models/MatchEvent');
const Booking = require('../models/Booking');
const { buildRows, writeDataset, toId } = require('./match_training_export_shared');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is required. Set it in backend/.env or in the environment.');
  process.exit(1);
}

async function exportDataset() {
  await mongoose.connect(process.env.MONGODB_URI, { autoIndex: true });

  try {
    const cases = await Case.find({
      lawyerId: { $ne: null },
    })
      .populate('clientId', 'role language location')
      .populate('lawyerId', 'role specialization location experience rating availability languages hourlyRate totalCases completedCases isVerified')
      .lean();

    if (!cases.length) {
      console.warn('No assigned cases found. Export skipped.');
      return;
    }

    const caseIds = cases.map((caseDoc) => caseDoc._id);
    const [events, bookings, lawyers] = await Promise.all([
      MatchEvent.find({ caseId: { $in: caseIds } }).sort({ createdAt: 1 }).lean(),
      Booking.find({ caseId: { $in: caseIds } }).lean(),
      User.find({ role: 'lawyer' })
        .select('-password -verificationToken -resetPasswordToken')
        .lean(),
    ]);

    const usersById = new Map(lawyers.map((lawyer) => [toId(lawyer._id), lawyer]));
    const rows = buildRows({ cases, usersById, events, bookings });
    const output = writeDataset(rows);
    if (!output) return;

    console.log(`Exported ${output.rowCount} candidate rows to ${output.csv}`);
    console.log(`Summary written to ${output.summary}`);
  } finally {
    await mongoose.disconnect();
  }
}

exportDataset().catch((error) => {
  console.error('Failed to export matchmaking training data:', error);
  process.exit(1);
});
