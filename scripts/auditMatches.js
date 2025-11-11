require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

// Ensure we can require models relative to backend folder
const User = require(path.join(__dirname, '..', 'backend', 'models', 'User'));
const Case = require(path.join(__dirname, '..', 'backend', 'models', 'Case'));

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/legalaid_connect';

async function main() {
  const started = Date.now();
  console.log('🔍 Auditing lawyer-case matches...');
  try {
    await mongoose.connect(MONGODB_URI, { dbName: undefined });
    console.log('✅ Connected to MongoDB');

    const [lawyers, clients, cases] = await Promise.all([
      User.find({ role: 'lawyer' }),
      User.find({ role: 'client' }),
      Case.find({}).sort({ createdAt: -1 })
    ]);

    console.log(`👥 Lawyers: ${lawyers.length}`);
    console.log(`🧑‍💼 Clients: ${clients.length}`);
    console.log(`📂 Cases: ${cases.length}`);

    if (cases.length === 0) {
      console.log('No cases to audit.');
      return;
    }

    // Build specialization index
    const specIndex = {}; // specialization -> [lawyer]
    for (const lawyer of lawyers) {
      (lawyer.specialization || []).forEach(spec => {
        if (!specIndex[spec]) specIndex[spec] = [];
        specIndex[spec].push(lawyer);
      });
    }

    const results = [];

    for (const c of cases) {
      const category = c.category;
      const matchingLawyers = (specIndex[category] || []).map(l => ({
        id: l._id.toString(),
        name: l.name || l.fullName || 'Unknown',
        experience: l.experience,
        rating: l.rating,
        availability: l.availability
      }));

      // Simple ranking: availability priority then rating then experience
      matchingLawyers.sort((a, b) => {
        const availScore = (x) => x === 'available' ? 2 : (x === 'busy' ? 1 : 0);
        const diffAvail = availScore(b.availability) - availScore(a.availability);
        if (diffAvail !== 0) return diffAvail;
        if (b.rating !== a.rating) return (b.rating || 0) - (a.rating || 0);
        return (b.experience || 0) - (a.experience || 0);
      });

      const assigned = c.lawyerId ? matchingLawyers.find(l => l.id === c.lawyerId.toString()) : null;

      results.push({
        caseId: c._id.toString(),
        title: c.title,
        category,
        status: c.status,
        assignedLawyerId: c.lawyerId ? c.lawyerId.toString() : null,
        assignedLawyerMatchesCategory: !!assigned,
        potentialMatches: matchingLawyers.slice(0, 5)
      });
    }

    console.log('\n=== CASE MATCH AUDIT REPORT ===');
    let matchedCount = 0;
    for (const r of results) {
      const header = `Case ${r.caseId} | ${r.title} | Category: ${r.category}`;
      console.log('\n' + header);
      console.log('-'.repeat(header.length));
      if (r.assignedLawyerId) {
        console.log(`Assigned Lawyer ID: ${r.assignedLawyerId} (${r.assignedLawyerMatchesCategory ? '✅ specialization match' : '⚠️ no specialization match'})`);
      } else {
        console.log('Assigned Lawyer: (none)');
      }
      if (r.potentialMatches.length === 0) {
        console.log('No lawyers with matching specialization found.');
      } else {
        if (!r.assignedLawyerId) matchedCount++;
        console.log('Top Potential Matches:');
        r.potentialMatches.forEach((m, idx) => {
          console.log(`  ${idx + 1}. ${m.name} (id:${m.id}) | exp:${m.experience || 0} | rating:${m.rating || 0} | availability:${m.availability}`);
        });
      }
    }

    const totalCases = results.length;
    const casesWithAssignedLawyer = results.filter(r => r.assignedLawyerId).length;
    const casesAssignedWithCorrectSpec = results.filter(r => r.assignedLawyerId && r.assignedLawyerMatchesCategory).length;
    const unassignedButHavePotential = results.filter(r => !r.assignedLawyerId && r.potentialMatches.length > 0).length;

    console.log('\n=== SUMMARY ===');
    console.log(`Total Cases: ${totalCases}`);
    console.log(`Cases Assigned: ${casesWithAssignedLawyer}`);
    console.log(`Assigned Cases w/ Specialization Match: ${casesAssignedWithCorrectSpec}`);
    console.log(`Unassigned Cases w/ Potential Matches: ${unassignedButHavePotential}`);
    console.log(`Unassigned Cases w/o Any Matching Lawyer: ${totalCases - casesWithAssignedLawyer - unassignedButHavePotential}`);

    console.log(`\nAudit completed in ${Date.now() - started}ms`);
  } catch (err) {
    console.error('❌ Audit failed:', err);
  } finally {
    await mongoose.disconnect().catch(()=>{});
  }
}

main();
