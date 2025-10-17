export const runtime = "nodejs";

import fs from "fs";
import path from "path";
import docusign from "docusign-esign";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { firstName, lastName, email } = await req.json();

    if (!firstName || !lastName || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Initialize DocuSign client with proper sandbox OAuth and API base paths
    const dsApiClient = new docusign.ApiClient();
    dsApiClient.setOAuthBasePath("account-d.docusign.com");
    dsApiClient.setBasePath("https://demo.docusign.net/restapi");

    // Load private RSA key
    const privateKeyPath = path.join(process.cwd(), "private.pem");
    if (!fs.existsSync(privateKeyPath)) throw new Error("Private key file not found");
    const privateKey = fs.readFileSync(privateKeyPath, "utf8");

    // Request JWT user token
    const results = await dsApiClient.requestJWTUserToken(
      process.env.INTEGRATION_KEY.trim(),
      process.env.USER_ID.trim(),
      ["signature", "impersonation"],
      privateKey,
      3600
    );

    const accessToken = results.body.access_token;
    if (!accessToken) throw new Error("Failed to obtain access token");
    dsApiClient.addDefaultHeader("Authorization", `Bearer ${accessToken}`);

    const envelopesApi = new docusign.EnvelopesApi(dsApiClient);
    const accountId = process.env.API_ACCOUNT_ID.trim();

    // Load PDF document
    const pdfPath = path.join(process.cwd(), "src", "app", "pdf", "agreement.pdf");
    if (!fs.existsSync(pdfPath)) throw new Error("PDF file not found");
    const pdfBase64 = fs.readFileSync(pdfPath).toString("base64");

    // Prepare envelope definition
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
    envelopeDefinition.recipients = {
      signers: [
        {
          email,
          name: `${firstName} ${lastName}`,
          recipientId: "1",
          routingOrder: "1",
          clientUserId: "1234",
          tabs: {
            signHereTabs: [
              {
                documentId: "1",
                pageNumber: "1",
                xPosition: "100",
                yPosition: "150",
              },
            ],
          },
        },
      ],
    };
    envelopeDefinition.status = "sent";

    // Create envelope and get ID
    const envelopeResponse = await envelopesApi.createEnvelope(accountId, { envelopeDefinition });
    const envelopeId = envelopeResponse.envelopeId;

    // Create recipient view (embedded signing URL)
    const viewRequest = new docusign.RecipientViewRequest();
    viewRequest.returnUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/signed?envelopeId=${envelopeId}`;
    viewRequest.authenticationMethod = "none";
    viewRequest.email = email;
    viewRequest.userName = `${firstName} ${lastName}`;
    viewRequest.clientUserId = "1234";

    const recipientView = await envelopesApi.createRecipientView(accountId, envelopeId, {
      recipientViewRequest: viewRequest,
    });

    return NextResponse.json({ success: true, signingUrl: recipientView.url, envelopeId });
  } catch (err) {
    console.error("DocuSign sendEnvelope error:", err.response?.body || err.message || err);
    if (
      err.response?.body?.error === "invalid_grant" &&
      err.response?.body?.error_description?.includes("consent")
    ) {
      return NextResponse.json(
        {
          error: "JWT consent required",
          consentUrl: `https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=${process.env.INTEGRATION_KEY}&redirect_uri=${process.env.NEXT_PUBLIC_BASE_URL}`,
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Failed to create envelope" }, { status: 500 });
  }
}
