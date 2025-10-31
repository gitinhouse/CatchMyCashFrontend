import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

function getFieldFlexible(form, fieldName) {
  try {
    // Try exact match first
    return form.getField(fieldName);
  } catch {
    // If not found, do a flexible lookup (case-insensitive)
    const allFields = form.getFields().map((f) => f.getName());
    const match = allFields.find(
      (name) => name.toLowerCase() === fieldName.toLowerCase()
    );
    if (match) {
      return form.getField(match);
    }

    // Optional: Try partial matching for extra flexibility
    const partialMatch = allFields.find((name) =>
      name.toLowerCase().includes(fieldName.toLowerCase().split(" (")[0])
    );
    if (partialMatch) {
      console.warn(`Used partial match: "${fieldName}" → "${partialMatch}"`);
      return form.getField(partialMatch);
    }

    console.warn(` Field not found in PDF: ${fieldName}`);
    return null;
  }
}

export async function fillInvestigatorAgreement(formData) {
  try {
    const pdfPath = path.join(process.cwd(), "src/app/pdf/agreement.pdf");
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const form = pdfDoc.getForm();

    const {
      claimantName,
      investigatorName,
      claimantEmail,
      claimantAddress,
      percentage,
      date,
      propertyId,
      propertyType,
      claimantNameInitial,
      investigatorNameInitial,
      contactNo,
      ssnId,
      allProperty,
    } = formData;

    try {
      const checkFields = form.getFields().map((f) => f.getName());
      form.getTextField("Claimant Name").setText(claimantName || "");
      form.getTextField("Investigator Name").setText(investigatorName || "");
      form.getTextField("Agreed Percentage").setText(percentage || "");

      form
        .getTextField("Amount")
        .setText(`$${allProperty?.[0].current_cash_balance || ""}`);
      form.getTextField("Property ID").setText(propertyId || "");
      form.getTextField("Type of Account").setText(propertyType || "");
      form
        .getTextField("Claimant's Initials")
        .setText(claimantNameInitial || "");
      form.getTextField("Claimant Initials").setText(claimantNameInitial || "");
      form
        .getTextField("Investigator's Initials")
        .setText(investigatorNameInitial || "");
      form.getTextField("Owner's Name").setText(claimantName || "");
      form
        .getTextField(
          "Owner's Address as Reported to the State Controller's Office"
        )
        .setText(claimantAddress || "");
      form.getTextField("Reported By").setText("SCO CA Government");
      form
        .getTextField("Securities")
        .setText(`${allProperty?.[0].shares_reported || ""}`);

      // investigator Record
      form.getTextField("Investigator").setText("Platform Builders LLC");
      form.getTextField("Date 2").setText(date || "");
      form
        .getTextField("Investigator Mailing Address")
        .setText("50 W Broadway Ste 333 #626733Salt Lake City, Utah 84101");
      form
        .getTextField("Investigator Email")
        .setText("help@fetchmydollars.com");
      form.getTextField("Investigator Phone").setText("6692324140");
      form.getTextField("Investigator's SSN or Tax ID").setText("39-4752608");

      form.getTextField("Claimant").setText(claimantName || "");
      form.getTextField("Phone Number").setText(contactNo || "");
      form.getTextField("Date 1").setText(date || "");
      form.getTextField("Claimant's Email").setText(claimantEmail || "");
      form.getTextField("Claimant's SSN or Tax ID").setText(ssnId || "");
      form
        .getTextField("Claimant Mailing Address")
        .setText(claimantAddress || "");

      allProperty?.forEach((prop, index) => {
        const i = index + 1;
        const ownerAddress = `${prop.owner_street_1 || ""}, ${
          prop.owner_city || ""
        }, ${prop.owner_state || ""} ${prop.owner_zip || ""}`.trim();

        getFieldFlexible(form, `Owner's Name (${i})`)?.setText(
          prop.owner_name || ""
        );
        getFieldFlexible(
          form,
          `Owner's Address as Reported to the State Controller's Office (${i})`
        )?.setText(ownerAddress || "");
        getFieldFlexible(form, `Reported by (${i})`)?.setText(
          "SCO CA Government"
        ); // works for both 'by' and 'By'
        getFieldFlexible(form, `Type of Account (${i})`)?.setText(
          prop.property_type || ""
        );
        getFieldFlexible(form, `Amount (${i})`)?.setText(
          `$${prop.current_cash_balance || ""}`
        );
        getFieldFlexible(form, `Securities (${i})`)?.setText(
          prop.shares_reported || ""
        );
        getFieldFlexible(form, `Property ID (${i})`)?.setText(
          prop.property_id || ""
        );
        getFieldFlexible(form, `Claimant's Initials (${i})`)?.setText(
          claimantNameInitial || ""
        );
      });
    } catch (e) {
      console.warn("Checkbox field not found or not fillable:", e);
    }

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
