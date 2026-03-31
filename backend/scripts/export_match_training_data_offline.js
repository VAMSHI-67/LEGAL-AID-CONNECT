const fs = require('fs');
const path = require('path');

const { buildRows, writeDataset, toId } = require('./match_training_export_shared');

const INPUT_DIR = path.join(__dirname, '../../mlops/data/raw');
const FILES = {
  cases: path.join(INPUT_DIR, 'cases.json'),
  users: path.join(INPUT_DIR, 'users.json'),
  matchevents: path.join(INPUT_DIR, 'matchevents.json'),
  bookings: path.join(INPUT_DIR, 'bookings.json'),
};

function readJsonArray(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.documents)) return parsed.documents;
  if (Array.isArray(parsed.data)) return parsed.data;
  return [];
}

function enrichCases(cases, usersById) {
  return cases
    .filter((caseDoc) => caseDoc && (caseDoc.lawyerId || caseDoc.assignmentHistory?.length))
    .map((caseDoc) => ({
      ...caseDoc,
      clientId: usersById.get(toId(caseDoc.clientId)) || caseDoc.clientId,
      lawyerId: usersById.get(toId(caseDoc.lawyerId)) || caseDoc.lawyerId,
      assignmentHistory: Array.isArray(caseDoc.assignmentHistory)
        ? caseDoc.assignmentHistory.map((entry) => ({
            ...entry,
            lawyerId: usersById.get(toId(entry.lawyerId)) || entry.lawyerId,
          }))
        : [],
    }));
}

function main() {
  const cases = readJsonArray(FILES.cases);
  const users = readJsonArray(FILES.users);
  const matchevents = readJsonArray(FILES.matchevents);
  const bookings = readJsonArray(FILES.bookings);

  if (!cases.length) {
    console.error(`No cases found in ${FILES.cases}`);
    process.exit(1);
  }

  if (!users.length) {
    console.error(`No users found in ${FILES.users}`);
    process.exit(1);
  }

  const usersById = new Map(users.map((user) => [toId(user._id), user]));
  const rows = buildRows({
    cases: enrichCases(cases, usersById),
    usersById,
    events: matchevents,
    bookings,
  });

  const output = writeDataset(rows);
  if (!output) process.exit(1);

  console.log(`Offline export complete using snapshots from ${INPUT_DIR}`);
  console.log(`Rows: ${output.rowCount}`);
  console.log(`CSV: ${output.csv}`);
  console.log(`Summary: ${output.summary}`);
}

main();
