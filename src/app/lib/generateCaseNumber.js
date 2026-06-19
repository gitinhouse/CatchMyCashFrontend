import UserCases from '../models/userCases';

export async function generateCaseNumber() {
  const year = new Date().getFullYear();
  let unique = false;
  let caseNumber;

  while (!unique) {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    caseNumber = `CM-${year}-${randomNum}`;
    const exists = await UserCases.findOne({ case_id: caseNumber });
    if (!exists) unique = true;
  }

  return caseNumber;
}
