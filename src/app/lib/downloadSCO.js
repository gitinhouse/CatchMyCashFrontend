import https from "https";
import fs from "fs";
import path from "path";
import unzipper from "unzipper";
import { importSCOData } from "./importSCOData.js";


export async function downloadAndExtractSCO() {
  try {
    const fileUrl = "https://dpupd.sco.ca.gov/00_All_Records.zip";
    const tmpZipPath = path.join(process.cwd(), "tmp_All_Records.zip");
    const extractDir = path.join(process.cwd(), "public", "SCORecords");

    // Ensure extraction folder exists
    if (!fs.existsSync(extractDir)) fs.mkdirSync(extractDir, { recursive: true });

    console.log("Starting download of SCO file...");

    // Download ZIP file as a stream
    await new Promise((resolve, reject) => {
      const file = fs.createWriteStream(tmpZipPath);
      https.get(fileUrl, { headers: { "User-Agent": "Mozilla/5.0" } }, (response) => {
        if (response.statusCode !== 200) return reject(new Error("Failed to download file"));
        response.pipe(file);
        file.on("finish", () => file.close(resolve));
      }).on("error", (err) => reject(err));
    });

    console.log("Download completed. Extracting...");

    // Extract ZIP in a streaming way
    await fs.createReadStream(tmpZipPath)
      .pipe(unzipper.Extract({ path: extractDir }))
      .promise();

    // Delete temporary ZIP
    fs.unlinkSync(tmpZipPath);

    console.log("Extraction complete. Files saved to:", extractDir);

    console.log("Starting CSV import into MongoDB...");
    await importSCOData();
    console.log("SCO data import process completed successfully!");

    return { success: true, extractedPath: extractDir };
  } catch (err) {
    console.error(" SCO download failed:", err);
    throw err;
  }
}
