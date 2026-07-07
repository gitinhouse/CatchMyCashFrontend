import fs from "fs";
import path from "path";
import connectToDatabase from "../../lib/mongodb.js";
import User from "../../models/UserInformation.js";
import UserDocs from "../../models/userDocs.js";
import UserCases from "../../models/userCases.js";
import mongoose from "mongoose";
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
import { sendClaimToSQS } from "../../lib/sqsService.js";

export const config = { api: { bodyParser: false } };

const isProduction = process.env.NODE_ENV === "production";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: isProduction
    ? fromNodeProviderChain()
    : fromIni({ profile: "default" }),
});

const DOCUMENT_TYPE_MAP = {
  proof_id: "Identity Proof",
  ssn_id: "SSN Proof",
  adress_proof: "Address Proof",
  brith_proof: "Birth Proof",
  employee_proof: "Employment Proof",
  claim_doc: "Claim Document",
  signed_doc: "Signed Agreement",
};

export async function POST(req) {
  try {
    await connectToDatabase();
    const { user_id, case_id, signed_doc } = await req.json();

    if (!user_id || !case_id || !signed_doc) {
      return new Response(
        JSON.stringify({
          error: "user_id, case_id, and signed_doc are required",
        }),
        { status: 400 }
      );
    }

    // Check if user exists
    const userExists = await User.findById(user_id);
    if (!userExists)
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });

    const existingDocs = await UserDocs.findOne({ case_id });
    if (existingDocs) {
      const updatedDocs = await UserDocs.findOneAndUpdate(
        { case_id },
        { $set: { signed_doc } },
        { new: true }
      );
      return new Response(JSON.stringify(updatedDocs), { status: 200 });
    }

    const newDocs = await UserDocs.create({
      user_id,
      case_id,
      signed_doc,
    });

    return new Response(JSON.stringify(newDocs), { status: 201 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}

export async function PUT(req) {
  try {
    await connectToDatabase();

    const formData = await req.formData();
    const case_id = formData.get("case_id")?.toString();
    if (!case_id)
      return new Response(JSON.stringify({ error: "case_id is required" }), {
        status: 400,
      });

    const existing = await UserDocs.findOne({ case_id });
    if (!existing)
      return new Response(JSON.stringify({ error: "Record not found" }), {
        status: 404,
      });

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
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}

export async function GET(req) {
  try {
    await connectToDatabase();

    /* ---------------- GET PARAM ---------------- */
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");

    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id is required" }), {
        status: 400,
      });
    }

    const userObjectId = mongoose.Types.ObjectId.isValid(user_id)
      ? new mongoose.Types.ObjectId(user_id)
      : user_id;

    /* ---------------- FETCH USER DOCS ---------------- */
    const userDocs = await UserDocs.findOne({ user_id: userObjectId }).sort({
      createdAt: -1,
    });
    if (!userDocs) {
      return new Response(
        JSON.stringify({ error: "User documents not found" }),
        { status: 404 }
      );
    }

    /* ---------------- FETCH USER CASE ---------------- */
    const userCase = await UserCases.findOne({ user_id: userObjectId })
      .sort({ createdAt: -1 })
      .select("claim_id");
    const claimId = userCase?.claim_id || null;

    /* ---------------- S3 CONFIG ---------------- */
    const bucket = process.env.BUCKET_NAME;
    const region = process.env.AWS_REGION;

    if (!bucket || !region) {
      throw new Error("S3 environment variables missing");
    }

    /* ---------------- PROCESS DOCUMENTS ---------------- */
    const documents = [];

    for (const [key, type] of Object.entries(DOCUMENT_TYPE_MAP)) {
      const value = userDocs[key];

      if (typeof value === "string" && value.trim() !== "") {
        const s3Key = value.startsWith("/") ? value.slice(1) : value;

        const command = new GetObjectCommand({
          Bucket: bucket,
          Key: s3Key,
        });

        const signedUrl = await getSignedUrl(s3Client, command, {
          expiresIn: 3600,
        });

        const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;

        documents.push({
          url: signedUrl, // 🔐 use signed URL (recommended)
          type,
          filename: s3Key.split("/").pop(),
        });
      }
    }
    await sendClaimToSQS(
      JSON.stringify({
        claimId,
        email: "test@gmail.com",
        documents,
      })
    );
    /* ---------------- FINAL RESPONSE ---------------- */
    return new Response(
      JSON.stringify({
        claimId,
        email: "test@gmail.com",
        documents,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("GET documents error:", error);

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
