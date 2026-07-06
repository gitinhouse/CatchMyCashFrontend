export const runtime = "nodejs";

import fs from "fs";
import path from "path";
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
import {
  createAuthenticatedDocuSignClient,
  docuSignErrorResponse,
} from "../../lib/docusignClient";

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

    const { envelopesApi, accountId } = await createAuthenticatedDocuSignClient();

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
    return docuSignErrorResponse(err, "Failed to save document");
  }
}
