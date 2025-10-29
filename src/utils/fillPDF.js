import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function fillInvestigatorAgreement(formData) {
  try {
    const pdfPath = path.join(process.cwd(), "src/app/pdf/agreement.pdf");
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const {
      claimantName,
      investigatorName,
      claimantEmail,
      claimantAddress,
      percentage,
      date,
      Amount,
      propertyId,
      propertyType,
      claimInitial,
      investigatorInitial,
      contactNo,
      ssnId,
    } = formData;

    firstPage.drawText(claimantName || "", {
      x: 320,
      y: 700,
      size: 10,
      font,
      color: rgb(0, 0, 0)
    });
    firstPage.drawText(investigatorName || "", {
      x: 180,
      y: 685,
      size: 10,
      font,
      color: rgb(0, 0, 0)
    });
    firstPage.drawText(claimantName || "", { x: 180, y: 620, size: 10, font,color: rgb(0, 0, 0) });
    firstPage.drawText(claimantAddress || "", {
      x: 180,
      y: 585,
      size: 10,
      font,
      color: rgb(0, 0, 0)
    });
    firstPage.drawText(Amount, { x: 450, y: 545, size: 10, font,color: rgb(0, 0, 0) });
    firstPage.drawText(propertyType, { x: 180, y: 565, size: 10, font,color: rgb(0, 0, 0) });
    firstPage.drawText(propertyId, { x: 450, y: 525, size: 10, font ,color: rgb(0, 0, 0)});
    firstPage.drawText(percentage ? `${percentage}` : "10%", {
      x: 180,
      y: 390,
      size: 10,
      font,
      color: rgb(0, 0, 0)
    });
    firstPage.drawText(claimInitial, { x: 330, y: 390, size: 10, font,color: rgb(0, 0, 0) });
    firstPage.drawText(investigatorInitial, { x: 500, y: 390, size: 10, font,color: rgb(0, 0, 0) });
    firstPage.drawText(claimantName, { x: 180, y: 220, size: 10, font,color: rgb(0, 0, 0) });
    firstPage.drawText(date || new Date().toLocaleDateString(), {
      x: 450,
      y: 220,
      size: 10,
      font,
      color: rgb(0, 0, 0)
    });
    firstPage.drawText(claimantEmail || "", { x: 180, y: 200, size: 10, font,color: rgb(0, 0, 0) });
    firstPage.drawText(claimantEmail || "", { x: 180, y: 185, size: 10, font,color: rgb(0, 0, 0) });
    firstPage.drawText(contactNo || "", { x: 450, y: 185, size: 10, font,color: rgb(0, 0, 0) });
    firstPage.drawText(ssnId || "", { x: 350, y: 150, size: 10, font,color: rgb(0, 0, 0) });

    const newPdfBytes = await pdfDoc.save();

    const timestamp = Date.now();
    const outputFileName = `filled_investigator_agreement_${timestamp}.pdf`;
    const outputDir = path.join(process.cwd(), "src/app/pdf");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, outputFileName);
    fs.writeFileSync(outputPath, newPdfBytes);

    return {
      fileName: outputFileName,
      filePath: outputPath,
    };
  } catch (err) {
    console.error("Error generating filled PDF:", err);
    throw new Error("Failed to generate filled PDF");
  }
}
