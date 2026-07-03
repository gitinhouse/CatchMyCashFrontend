export const runtime = "nodejs";

import fs from "fs";
import path from "path";
import docusign from "docusign-esign";
import { PDFDocument } from "pdf-lib";
import { NextResponse } from "next/server";
import { fillInvestigatorAgreement } from "../../../utils/fillPDF";

function splitLegalName(legalName) {
  const name = String(legalName || "").trim();
  if (!name) return { firstName: "", lastName: "" };

  const parts = name.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: "", lastName: parts[0] };
  }

  return {
    firstName: parts[parts.length - 1],
    lastName: parts.slice(0, -1).join(" "),
  };
}

export async function POST(req) {
  try {
    const {
      firstName: rawFirstName,
      lastName: rawLastName,
      email,
      searchResults: rawResults,
      userAgreement: rawData,
    } = await req.json();

    let searchResults;
    let userAgreement;
    try {
      if (typeof rawResults === "string") {
        const onceParsed = JSON.parse(rawResults);
        searchResults =
          typeof onceParsed === "string" ? JSON.parse(onceParsed) : onceParsed;
      } else {
        searchResults = rawResults;
      }

      if (typeof rawData === "string") {
        const onceParsed = JSON.parse(rawData);
        userAgreement =
          typeof onceParsed === "string" ? JSON.parse(onceParsed) : onceParsed;
      } else {
        userAgreement = rawData;
      }
    } catch (err) {
      console.error("Failed to parse searchResults:", err);
      searchResults = [];
    }

    const fallbackName = splitLegalName(userAgreement?.legal_name);
    const firstName = rawFirstName || fallbackName.firstName;
    const lastName = rawLastName || fallbackName.lastName;

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    const allProperty = searchResults;
    const property = searchResults?.[0];
    const claimantAddress = [
      property?.owner_street_1,
      property?.owner_city,
      property?.owner_state,
      property?.owner_zip,
    ]
      .filter(Boolean)
      .join(" ");

    const filledPdfBytes = await fillInvestigatorAgreement({
      claimantName: `${firstName} ${lastName}`,
      claimantNameInitial: `${firstName.charAt(0).toUpperCase()}${lastName
        .charAt(0)
        .toUpperCase()}*`,
      investigatorNameInitial: "EC",
      investigatorName: "Platform Builders LLC",
      claimantEmail: email,
      claimantAddress,
      percentage: "10%",
      propertyId: property?.property_id,
      propertyType: property?.property_type,
      date: new Date().toLocaleDateString(),
      contactNo: userAgreement?.contact_no,
      ssnId: userAgreement?.ssn_id,
      allProperty: allProperty,
    });
    // Initialize DocuSign client
    const dsApiClient = new docusign.ApiClient();
    dsApiClient.setOAuthBasePath("account.docusign.com");
    dsApiClient.setBasePath("https://na4.docusign.net/restapi");

    // Load private RSA key
    const privateKeyPath = path.join(process.cwd(), "private.pem");
    if (!fs.existsSync(privateKeyPath))
      throw new Error("Private key file not found");
    const privateKey = fs.readFileSync(privateKeyPath, "utf8");

    // Request JWT token
    const results = await dsApiClient.requestJWTUserToken(
      process.env.DOCU_SIGN_INTEGRATION_KEY.trim(),
      process.env.DOCU_SIGN_USER_ID.trim(),
      ["signature", "impersonation"],
      privateKey,
      3600
    );

    const accessToken = results.body.access_token;
    if (!accessToken) throw new Error("Failed to obtain access token");
    dsApiClient.addDefaultHeader("Authorization", `Bearer ${accessToken}`);

    const envelopesApi = new docusign.EnvelopesApi(dsApiClient);
    const accountId = process.env.DOCU_SIGN_API_ACCOUNT_ID.trim();
    // Load PDF and determine last page
    const pdfPath = path.join(
      process.cwd(),
      "src",
      "app",
      "pdf",
      filledPdfBytes?.fileName
    );
    if (!fs.existsSync(pdfPath)) throw new Error("PDF file not found");
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const numberOfPages = pdfDoc.getPageCount();

    const pdfBase64 = pdfBytes.toString("base64");
    // Create envelope definition
    const envelopeDefinition = new docusign.EnvelopeDefinition();
    envelopeDefinition.emailSubject = "Please sign this document";
    envelopeDefinition.documents = [
      {
        documentBase64: pdfBase64,
        name: "Agreement",
        fileExtension: "pdf",
        documentId: "1",
      },
    ];

    const signer = new docusign.Signer();
    signer.email = email;
    signer.name = `${firstName} ${lastName}`;
    signer.recipientId = "1";
    signer.routingOrder = "1";
    signer.clientUserId = "1234";

    const signHere = new docusign.SignHere();
    signHere.documentId = "1";
    signHere.pageNumber = "1"; //numberOfPages.toString();
    signHere.xPosition = "180";
    signHere.yPosition = "593";

    const initialHere1 = new docusign.InitialHere();
    initialHere1.documentId = "1";
    initialHere1.pageNumber = "1";
    initialHere1.xPosition = "80";
    initialHere1.yPosition = "270";

    const initialHere2 = new docusign.InitialHere();
    initialHere2.documentId = "1";
    initialHere2.pageNumber = "1";
    initialHere2.xPosition = "330";
    initialHere2.yPosition = "370";

    const dynamicInitialTabs = [];
    allProperty?.forEach((property, index) => {
      const initialHere = new docusign.InitialHere();
      initialHere.documentId = "1";
      initialHere.pageNumber = "2"; 
      initialHere.xPosition = "80"; 
      initialHere.yPosition = String(180 + index * 170); 
      dynamicInitialTabs.push(initialHere);
    });

    const tabs = new docusign.Tabs();
    tabs.signHereTabs = [signHere];
    tabs.initialHereTabs = [initialHere1, initialHere2, ...dynamicInitialTabs];
    signer.tabs = tabs;

    envelopeDefinition.recipients = { signers: [signer] };
    envelopeDefinition.status = "sent";
    
    // Create envelope
    const envelopeResponse = await envelopesApi.createEnvelope(accountId, {
      envelopeDefinition,
    });
    const envelopeId = envelopeResponse.envelopeId;

    // Create recipient view (embedded signing)
    const viewRequest = new docusign.RecipientViewRequest();
    viewRequest.returnUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/signed?envelopeId=${envelopeId}`;
    viewRequest.authenticationMethod = "none";
    viewRequest.email = email;
    viewRequest.userName = `${firstName} ${lastName}`;
    viewRequest.clientUserId = "1234";

    const recipientView = await envelopesApi.createRecipientView(
      accountId,
      envelopeId,
      {
        recipientViewRequest: viewRequest,
      }
    );
    return NextResponse.json({
      success: true,
      signingUrl: recipientView.url,
      envelopeId,
    });
  } catch (err) {
    console.error(
      "DocuSign sendEnvelope error:",
      err.response?.body || err.message || err
    );

    if (
      err.response?.body?.error === "invalid_grant" &&
      err.response?.body?.error_description?.includes("consent")
    ) {
      return NextResponse.json(
        {
          error: "JWT consent required",
          consentUrl: `https://account.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=${process.env.DOCU_SIGN_INTEGRATION_KEY}&redirect_uri=${process.env.NEXT_PUBLIC_BASE_URL}`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create envelope" },
      { status: 500 }
    );
  }
}
