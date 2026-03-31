const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const dotenv = require('dotenv');
const User = require('../models/User');
const Case = require('../models/Case');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI missing');
    process.exit(1);
}

// Configuration
const CSV_PATH = path.join(__dirname, '../../ml_model_v2/data/raw/archive/judgments.csv');

const connect = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ DB Connection Error:', error);
        process.exit(1);
    }
};

const ingestData = async () => {
    await connect();

    const lawyersMap = new Map(); // Name -> { cases: [], specialization: Set }
    const casesBatch = [];

    console.log(`🚀 Reading ${CSV_PATH}...`);

    fs.createReadStream(CSV_PATH)
        .pipe(csv())
        .on('data', (row) => {
            // Mapping Logic: Identify Lawyer & Case Details
            // This depends on the actual CSV headers. 
            // Default assumption: 'Petitioner', 'Respondent', 'Date', 'Judge', 'Judgment'

            // Extract Advocate Name (Heuristic: Look for 'Adv.' or assuming a column exists)
            // Strategy: Since valid column names are unknown until `head` command fixes it,
            // we will use a generic "Petitioner Counsel" or mixed field if available.

            // Placeholder: Assuming `advocate_name` or extracting from text
            // For now, we'll simulate extraction if specific columns aren't found.

            // REAL LOGIC (to be updated after head check):
            // If the CSV has 'Petitioner_Advocate' or similar.
        })
        .on('end', async () => {
            console.log('✅ CSV Parsing Complete.');
            // Process maps and insert to DB
            process.exit(0);
        });
};

// Start
ingestData();
