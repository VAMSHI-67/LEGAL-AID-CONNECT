const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const User = require('../models/User');
const Case = require('../models/Case');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI missing in backend/.env');
    process.exit(1);
}

const connect = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

const extractData = async () => {
    await connect();

    try {
        console.log('🔍 Fetching completed cases...');

        // Find cases that have a lawyer assigned and are completed/closed
        // We use 'populate' to pull in Client and Lawyer details
        const cases = await Case.find({
            lawyerId: { $ne: null },
            status: { $in: ['completed', 'closed', 'cancelled'] } // Include cancelled as negative examples?
        })
            .populate('clientId', 'location language budget')
            .populate('lawyerId', 'specialization location experience rating availability consultation_fee successRate languages');

        if (cases.length === 0) {
            console.warn('⚠️ No historical cases found. Run `node backend/scripts/seed_history.js` first.');
            process.exit(0);
        }

        console.log(`📊 Found ${cases.length} cases. Processing...`);

        // CSV Header matches model input features + target
        const header = [
            // Client Features
            'case_type', 'location', 'urgency_level', 'budget', 'preferred_language', 'case_complexity_score',
            // Lawyer Features
            'specialization', 'city', 'experience', 'success_rate', 'rating', 'consultation_fee', 'availability',
            // Target
            'match'
        ].join(',');

        const rows = [header];

        let skipped = 0;
        let successful = 0;

        for (const c of cases) {
            if (!c.clientId || !c.lawyerId) {
                skipped++;
                continue;
            }

            // --- Feature Mapping ---
            // 1. Client Features
            const case_type = c.category;
            const location = c.clientId.location?.district || c.location?.district || 'Unknown';
            // urgency: mapping enum to int [low:1, medium:3, high:4, urgent:5]
            const urgencyMap = { 'low': 1, 'medium': 3, 'high': 4, 'urgent': 5 };
            const urgency_level = urgencyMap[c.priority] || 3;
            const budget = c.budget?.max || 20000;
            const preferred_language = (c.clientId.language && c.clientId.language[0]) || 'English';
            // complexity: heuristic based on priority + duration
            const duration = c.completedAt && c.startedAt ? Math.ceil((c.completedAt - c.startedAt) / (1000 * 60 * 60 * 24)) : 30;
            const case_complexity_score = Math.min((duration / 100) + (urgency_level * 0.1), 1.0).toFixed(2);

            // 2. Lawyer Features
            const lawyer = c.lawyerId;
            const specialization = lawyer.specialization?.[0] || 'General';
            const city = lawyer.location?.district || 'Unknown';
            const experience = lawyer.experience || 5;
            const success_rate = (lawyer.successRate || 50) / 100; // Normalized 0-1
            const rating = lawyer.rating || 0;
            const consultation_fee = lawyer.hourlyRate ? lawyer.hourlyRate * 10 : 15000; // Approx heuristic
            const availability = 1; // Existing cases imply they were available

            // 3. Target Variable (The "Truth")
            // A match is "1" if the case completed successfully OR got a good rating (>3)
            // A match is "0" if cancelled OR rating <= 2
            let match = 0;
            if (c.status === 'completed') {
                if (c.clientRating?.rating >= 3 || !c.clientRating) match = 1;
                // If explicitly marked unsuccessful, maybe 0? Let's treat completed as generally 1 unless bad rating.
                if (c.outcome?.status === 'unsuccessful' && c.clientRating?.rating < 4) match = 0;
            }
            if (c.outcome?.status === 'successful') match = 1;

            const row = [
                case_type,
                location,
                urgency_level,
                budget,
                preferred_language,
                case_complexity_score,
                specialization,
                city,
                experience,
                success_rate.toFixed(2),
                rating,
                consultation_fee,
                availability,
                match
            ].join(',');

            rows.push(row);
            successful++;
        }

        // Output Path: ml_model/real_data.csv (or direct to dataset path)
        const outputPath = path.join(__dirname, '../../ml_model/matchmaking_dataset.csv'); // Overwrite the main dataset!
        fs.writeFileSync(outputPath, rows.join('\n'));

        console.log(`✅ Extracted ${successful} rows to ${outputPath}`);
        console.log(`⚠️ Skipped ${skipped} incomplete records.`);

    } catch (error) {
        console.error('❌ Error extraction:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

extractData();
