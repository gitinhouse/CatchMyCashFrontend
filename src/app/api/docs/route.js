import fs from "fs";
import path from "path";
import connectToDatabase from "../../lib/mongodb.js";
import User from "../../models/UserInformation.js";
import UserDocs from "../../models/userDocs.js";

export const config = { api: { bodyParser: false } };

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

    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const formData = await req.formData();
    const case_id = formData.get("case_id")?.toString();

    if (!case_id) {
      return new Response(JSON.stringify({ error: "case_id is required" }), { status: 400 });
    }

    // Find existing record
    const existing = await UserDocs.findOne({ case_id });
    if (!existing) {
      return new Response(JSON.stringify({ error: "Record not found" }), { status: 404 });
    }

    // Document field mapping
    const docMapping = {
      proof_id: "proof_id",
      ssn_id: "ssn_id",
      adress_proof: "adress_proof",
      brith_proof: "brith_proof",
      employee_proof: "employee_proof",
      claim_doc:"claim_doc"
    };

    const documentPaths = {};

    // Handle file uploads
    for (const [formKey, dbKey] of Object.entries(docMapping)) {
      const file = formData.get(formKey);
      if (file && file.arrayBuffer) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = Date.now() + "-" + file.name;
        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, buffer);
        documentPaths[dbKey] = filename;
      }
    }

    // ✅ Required fields check
    const requiredFields = ["proof_id", "ssn_id", "adress_proof"];
    for (const field of requiredFields) {
      if (!documentPaths[field]) {
        return new Response(
          JSON.stringify({ error: `${field} file is required` }),
          { status: 400 }
        );
      }
    }

    // Update DB record with new file paths
    const updatedDocs = await UserDocs.findOneAndUpdate(
      { case_id },
      { $set: documentPaths },
      { new: true }
    );

    return new Response(JSON.stringify(updatedDocs), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// GET endpoint remains unchanged
export async function GET(req) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const case_id = searchParams.get("case_id");

    if (case_id) {
      const caseDocs = await userDocs
        .findById(case_id)
        .populate("user_id", "first_name last_name email");
      if (!caseDocs) {
        return NextResponse.json({ error: "Docs not found" }, { status: 404 });
      }
      return NextResponse.json(caseDocs);
    } else {
      const allDocs = await userDocs
        .find({})
        .populate("user_id", "first_name last_name email");
      return NextResponse.json(allDocs);
    }
  } catch (error) {
    console.error("GET /api/uploadDocs error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
