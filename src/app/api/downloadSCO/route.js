import https from "https";
import fs from "fs";
import path from "path";
import unzipper from "unzipper";

export async function GET() {
  try {
    const fileUrl = "https://dpupd.sco.ca.gov/00_All_Records.zip";
    const tmpZipPath = path.join(process.cwd(), "tmp_All_Records.zip");
    const extractDir = path.join(process.cwd(), "public", "SCORecords");

    // Ensure extraction folder exists
    if (!fs.existsSync(extractDir)) fs.mkdirSync(extractDir, { recursive: true });

    // Download ZIP file as a stream
    await new Promise((resolve, reject) => {
      const file = fs.createWriteStream(tmpZipPath);
      https.get(fileUrl, { headers: { "User-Agent": "Mozilla/5.0" } }, (response) => {
        if (response.statusCode !== 200) return reject(new Error("Failed to download file"));
        response.pipe(file);
        file.on("finish", () => file.close(resolve));
      }).on("error", (err) => reject(err));
    });

    // Extract ZIP in a streaming way
    await fs.createReadStream(tmpZipPath)
      .pipe(unzipper.Extract({ path: extractDir }))
      .promise();

    // Delete temporary ZIP
    fs.unlinkSync(tmpZipPath);

    return new Response(
      JSON.stringify({ message: "SCO records downloaded and extracted successfully", extractedPath: extractDir }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "Server error", details: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
