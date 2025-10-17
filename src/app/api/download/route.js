export const runtime = "nodejs";

import fs from "fs";
import path from "path";
import docusign from "docusign-esign";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const envelopeId = searchParams.get("envelopeId");
    if (!envelopeId) {
      return NextResponse.json({ error: "Missing envelopeId" }, { status: 400 });
    }

    const dsApiClient = new docusign.ApiClient();
    dsApiClient.setOAuthBasePath("account-d.docusign.com");
    dsApiClient.setBasePath("https://demo.docusign.net/restapi");

    const privateKeyPath = path.join(process.cwd(), "private.pem");
    if (!fs.existsSync(privateKeyPath)) throw new Error("Private key file not found");
    const privateKey = fs.readFileSync(privateKeyPath, "utf8");

    const results = await dsApiClient.requestJWTUserToken(
      process.env.INTEGRATION_KEY.trim(),
      process.env.USER_ID.trim(),
      ["signature", "impersonation"],
      privateKey,
      3600
    );
    const accessToken = results.body.access_token;
    dsApiClient.addDefaultHeader("Authorization", "Bearer " + accessToken);

    const envelopesApi = new docusign.EnvelopesApi(dsApiClient);
    const accountId = process.env.API_ACCOUNT_ID.trim();

    const documentId = "1"; 
    
    const pdfBytes = await envelopesApi.getDocument(accountId, envelopeId, documentId, null);

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="signed-document-${envelopeId}.pdf"`,
      },
    });
  } catch (err) {
    console.error("DocuSign download error:", err.response?.body || err.message || err);
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
    return NextResponse.json({ error: "Failed to download document" }, { status: 500 });
  }
}
