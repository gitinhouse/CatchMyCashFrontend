import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import csvParser from "csv-parser";
import mongoose from "mongoose";
import AllProperty from "../models/allProperty.js"; 

//dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error("Please define MONGO_URI in .env.local");

async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) return; // already connected
  await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("✅ Connected to MongoDB");
}

export async function importSCOData() {
  await connectToDatabase();

  const csvDir = path.join(process.cwd(), "public", "SCORecords");
  const csvFile = fs.readdirSync(csvDir).find(f => f.endsWith(".csv"));
  if (!csvFile) throw new Error("No CSV file found in " + csvDir);

  const csvPath = path.join(csvDir, csvFile);
  console.log(`Found CSV file: ${csvFile}`);

  const stream = fs.createReadStream(csvPath).pipe(csvParser());

  const batchSize = 1000;
  let bulkOps = [];
  let counter = 0;

  stream.on("data", (row) => {
    const normalizedRow = {};
    Object.keys(row).forEach(k => {
      normalizedRow[k.toLowerCase()] = row[k];
    });

    bulkOps.push({
      insertOne: {
        document: {
          property_id: normalizedRow.property_id,
          property_type: normalizedRow.property_type,
          cash_reported: normalizedRow.cash_reported,
          shares_reported: normalizedRow.shares_reported,
          name_of_security_reported: normalizedRow.name_of_securities_reported,
          no_of_owners: normalizedRow.no_of_owners,
          owner_name: normalizedRow.owner_name,
          owner_street_1: normalizedRow.owner_street_1,
          owner_street_2: normalizedRow.owner_street_2,
          owner_street_3: normalizedRow.owner_street_3,
          owner_city: normalizedRow.owner_city,
          owner_state: normalizedRow.owner_state,
          owner_zip: normalizedRow.owner_zip,
          owner_country_code: normalizedRow.owner_country_code,
          current_cash_balance: normalizedRow.current_cash_balance,
          no_of_pending_claimes: normalizedRow.number_of_pending_claims,
          no_of_paid_claimes: normalizedRow.number_of_paid_claims,
          holder_name: normalizedRow.holder_name,
          holder_street_1: normalizedRow.holder_street_1,
          holder_street_2: normalizedRow.holder_street_2,
          holder_street_3: normalizedRow.holder_street_3,
          holder_city: normalizedRow.holder_city,
          holder_state: normalizedRow.holder_state,
          holder_zip: normalizedRow.holder_zip,
          cusip: normalizedRow.cusip,
          createdAt: new Date(),
        },
      },
    });

    counter++;
    if (bulkOps.length >= batchSize) {
      const ops = bulkOps;
      bulkOps = [];
      mongoose.connection.collection("allproperties").bulkWrite(ops).catch(console.error);
    }
  });

  return new Promise((resolve, reject) => {
    stream.on("end", async () => {
      if (bulkOps.length > 0) {
        await mongoose.connection.collection("allproperties").bulkWrite(bulkOps);
      }
      console.log(`✅ CSV import complete! Total rows processed: ${counter}`);
      resolve();
    });

    stream.on("error", (err) => {
      console.error("❌ CSV stream error:", err);
      reject(err);
    });
  });
}
