export const runtime = "nodejs";

import fs from "fs";
import path from "path";
import docusign from "docusign-esign";
import { NextResponse } from "next/server";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import {
  fromIni,
  fromNodeProviderChain,
  fromTemporaryCredentials,
} from "@aws-sdk/credential-providers";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const isProduction = process.env.NODE_ENV === "production";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: isProduction
    ? fromNodeProviderChain() 
    : fromIni({ profile: "default" }), 
});

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const envelopeId = searchParams.get("envelopeId");
    if (!envelopeId) {
      return NextResponse.json(
        { error: "Missing envelopeId" },
        { status: 400 }
      );
    }

    const dsApiClient = new docusign.ApiClient();
    dsApiClient.setOAuthBasePath("account.docusign.com");
    dsApiClient.setBasePath("https://na4.docusign.net/restapi");

    const privateKeyPath = path.join(process.cwd(), "private.pem");
    if (!fs.existsSync(privateKeyPath))
      throw new Error("Private key file not found");
    const privateKey = fs.readFileSync(privateKeyPath, "utf8");

    const results = await dsApiClient.requestJWTUserToken(
    process.env.DOCU_SIGN_INTEGRATION_KEY.trim(),
      process.env.DOCU_SIGN_USER_ID.trim(),
      ["signature", "impersonation"],
      privateKey,
      3600
    );
    const accessToken = results.body.access_token;
    dsApiClient.addDefaultHeader("Authorization", "Bearer " + accessToken);

    const envelopesApi = new docusign.EnvelopesApi(dsApiClient);
    const accountId = process.env.DOCU_SIGN_API_ACCOUNT_ID.trim();

    const documentId = "1";
    const pdfBytes = await envelopesApi.getDocument(
      accountId,
      envelopeId,
      documentId,
      null
    );

    // Create folder path if not exists
    const documentsFolder = path.join(process.cwd(), "documents");
    if (!fs.existsSync(documentsFolder)) {
      fs.mkdirSync(documentsFolder, { recursive: true });
    }

    // Save PDF to server
    const fileName = `signed-document-${envelopeId}.pdf`;
    const filePath = path.join(documentsFolder, fileName);
    fs.writeFileSync(filePath, pdfBytes, "binary");

    const fileBuffer = fs.readFileSync(filePath);
    const s3Key = `${fileName}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: "application/pdf",
      })
    );
    fs.unlinkSync(filePath);

    return NextResponse.json({
      success: true,
      message: `Document saved on server at ${filePath}`,
      filePath: s3Key,
    });
  } catch (err) {
    console.error(
      "DocuSign download error:",
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
      { error: "Failed to save document" },
      { status: 500 }
    );
  }
}
