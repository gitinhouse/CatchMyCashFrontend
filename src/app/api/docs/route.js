import fs from "fs";
import path from "path";
import connectToDatabase from "../../lib/mongodb.js";
import User from "../../models/UserInformation.js";
import UserDocs from "../../models/userDocs.js";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { fromIni, fromNodeProviderChain,fromTemporaryCredentials } from "@aws-sdk/credential-providers";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const config = { api: { bodyParser: false } };

const isProduction = process.env.NODE_ENV === "production";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: isProduction
    ? fromNodeProviderChain() 
    : fromIni({ profile: "default" }), 
});

export async function POST(req) {
  try {
    await connectToDatabase();
    const { user_id, case_id, signed_doc } = await req.json();

    if (!user_id || !case_id || !signed_doc) {
      return new Response(
        JSON.stringify({ error: "user_id, case_id, and signed_doc are required" }),
        { status: 400 }
      );
    }

    // Check if user exists
    const userExists = await User.findById(user_id);
    if (!userExists)
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

    // Create base record
    const newDocs = await UserDocs.create({
      user_id,
      case_id,
      signed_doc,
    });

    return new Response(JSON.stringify(newDocs), { status: 201 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}


export async function PUT(req) {
  try {
    await connectToDatabase();

    const formData = await req.formData();
    const case_id = formData.get("case_id")?.toString();
    if (!case_id)
      return new Response(JSON.stringify({ error: "case_id is required" }), { status: 400 });

    const existing = await UserDocs.findOne({ case_id });
    if (!existing)
      return new Response(JSON.stringify({ error: "Record not found" }), { status: 404 });

    const docMapping = {
      proof_id: "proof_id",
      ssn_id: "ssn_id",
      adress_proof: "adress_proof",
      brith_proof: "brith_proof",
      employee_proof: "employee_proof",
      claim_doc: "claim_doc",
    };

    const documentKeys = {};

    for (const [formKey, dbKey] of Object.entries(docMapping)) {
      const file = formData.get(formKey);
      if (file && file.arrayBuffer) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `${Date.now()}-${file.name}`;
      
        await s3Client.send(
          new PutObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: fileName,
            Body: buffer,
            ContentType: file.type,
          })
        );

        documentKeys[dbKey] = fileName;
      }
    }

    const updatedDocs = await UserDocs.findOneAndUpdate(
      { case_id },
      { $set: documentKeys },
      { new: true }
    );

    return new Response(JSON.stringify(updatedDocs), { status: 200 });
  } catch (err) {
    console.error("Upload error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function GET(req) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const case_id = searchParams.get("case_id");
    if (!case_id)
      return new Response(JSON.stringify({ error: "case_id is required" }), { status: 400 });

    const record = await UserDocs.findOne({ case_id });
    if (!record)
      return new Response(JSON.stringify({ error: "Record not found" }), { status: 404 });

    const bucket = process.env.BUCKET_NAME;
    if (!bucket)
      throw new Error("Environment variable BUCKET_NAME is missing");

    const docKeys = [
      "proof_id",
      "ssn_id",
      "adress_proof",
      "brith_proof",
      "employee_proof",
      "claim_doc",
      "signed_doc",
    ];

    const signedUrls = {};

    for (const key of docKeys) {
      const value = record[key];
      if (typeof value === "string" && value.trim() !== "") {
        const command = new GetObjectCommand({
          Bucket: bucket,
          Key: value.startsWith("/") ? value.slice(1) : value, 
        });
        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        signedUrls[key] = url;
      }
    }

    return new Response(JSON.stringify(signedUrls), { status: 200 });
  } catch (err) {
    console.error("Error generating signed URLs:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

