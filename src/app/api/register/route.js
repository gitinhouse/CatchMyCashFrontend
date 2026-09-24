import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectToDatabase from '../../lib/mongodb';
import UserLogin from '../../models/userLogin';
import mongoose from 'mongoose';
import { sendEmail } from '../../lib/mailer';
import { sendExistingAccountEmail } from '../../lib/existingAccountEmail';
import {
  generatePassword,
  sendCredentialsEmail,
} from '../../lib/passwordSetup';
import bcrypt from 'bcryptjs';
import { createNotification } from '../../lib/createNotification.js';
import EmailVerification from '../../models/emailVerification';
import {
  normalizeEmail,
  readVerifiedEmailToken,
} from '../../lib/emailVerification';
import UserCases from '../../models/userCases';
import UserInformation from '../../models/UserInformation';
import UserProperty from '../../models/userProperty';
import { verifyToken } from '../../lib/verifyToken';
import { Types } from 'mongoose';


export async function POST(req) {
  try {
    // A malformed request is answered from the request alone, before a
    // database connection is opened, so it reports what is wrong with it
    // rather than a connection error.
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid request body" },
        { status: 400 }
      );
    }

    const userEmail = body.userEmail?.trim().toLowerCase();
    const { user_id, userType } = body;

    if (!userEmail) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // The address a claim is filed under has to be one its owner can read:
    // either the address of the account the request is signed in as, or one
    // that has just been proved by an emailed code. Trusting the field alone
    // would let anyone file under a stranger's address.
    const ownership = confirmEmailOwnership(req, body, userEmail);

    await connectToDatabase();

    // A missing or malformed user_id must never reach findOne(): Mongoose drops
    // undefined values, so findOne({ user_id }) would become findOne({}) and
    // return an arbitrary account.
    const userObjectId = Types.ObjectId.isValid(user_id)
      ? new Types.ObjectId(user_id)
      : null;

    // The email being registered is the identity that decides whether this is a
    // returning user. Matching on user_id first made a brand-new email look
    // like an existing account whenever the browser still carried a user_id
    // from an earlier search, so the claimant got the "you already have an
    // account" mail instead of their welcome mail — and that older account had
    // its address silently overwritten.
    const existingUser = await UserLogin.findOne({ userEmail });

    if (existingUser) {
      // Nothing is written here, deliberately. This account belongs to somebody
      // who already signed up; re-pointing its user_id at whatever search
      // session happens to be in the browser is how a claim filed from one
      // session started dragging an unrelated account around with it. The
      // account is only told it exists.
      //
      // This is answered before the ownership check on purpose. The check can
      // only pass for an address whose owner proved it, and an address that
      // already has an account can never be proved — the code endpoint refuses
      // to send one to it — so refusing first meant this reply, and the mail
      // that goes with it, were unreachable. Nothing here acts on the account
      // or gives anything away that the login page does not.
      console.log('[register] existing account, no changes written', {
        email: userEmail,
        proved: ownership.ok === true,
      });

      const notice = await sendExistingAccountEmail(userEmail);

      if (!ownership.ok) {
        // Whoever is asking has not shown the address is theirs, so they are
        // told to check it rather than handed the account it belongs to.
        return NextResponse.json(
          {
            message:
              "An account already exists for this email. We've emailed it a reminder of how to sign in.",
            account_exists: true,
            user: { user_type: "Existing" },
          },
          { status: 200 },
        );
      }

      if (ownership.via === 'otp') {
        await markVerificationConsumed(userEmail);
      }

      // The bell agrees with the inbox. A signed-in claimant reaches this on
      // every claim they file, and without the same restraint the email is
      // under they would collect a notice each time saying what the last one
      // already said.
      if (notice.sent) {
        await createNotification(
          existingUser.user_id,
          "Account Found",
          "You already have an account. Please check your previous email for your login details."
        );
      }

      return NextResponse.json(
        {
          message: "Existing user found. Please check your previous email for login details.",
          account_exists: true,
          user: {
            id: existingUser._id,
            email: existingUser.userEmail,
            user_id: existingUser.user_id,
            type: existingUser.userType,
            user_type: "Existing",
          },
        },
        { status: 200 }
      );
    }

    // Creating an account is the part that needs the address proved, so the
    // check is enforced here rather than at the top.
    if (!ownership.ok) {
      return NextResponse.json(
        {
          message:
            'Please verify your email address before continuing with your claim.',
          reason: ownership.reason,
          email_verification_required: true,
        },
        { status: 403 },
      );
    }

    if (ownership.via === 'otp') {
      await markVerificationConsumed(userEmail);
    }

    // ================= CREATE NEW USER =================
    // This email has never been registered, so the claimant gets a fresh
    // account. The account is created on their behalf while they file a claim,
    // so they never chose a password — one is generated here and sent to them
    // with the address it belongs to. Only the hash is stored.
    const generatedPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    // UserLogin.user_id is unique, so this id may already belong to somebody.
    // It does exactly when a claimant reaches this form from a browser that
    // has already filed under a different address — which is what happens
    // after "use a different email". That account is left completely alone:
    // overwriting its address is what locked people out of their own logins.
    // The new claimant gets an identity of their own instead.
    const sessionAccount = userObjectId
      ? await UserLogin.findOne({ user_id: userObjectId })
      : null;

    let ownerId = userObjectId;

    if (sessionAccount) {
      console.log('[register] search session belongs to another account', {
        taken_by: sessionAccount.userEmail,
        registering: userEmail,
      });
      ownerId = await cloneSearchIdentity(userObjectId);
    }

    if (!ownerId) {
      return NextResponse.json(
        { message: "A valid user_id is required to register" },
        { status: 400 },
      );
    }

    const newUser = await UserLogin.create({
      user_id: ownerId,
      userEmail,
      userPassword: hashedPassword,
      userType: userType || "User",
    });

    const token = jwt.sign(
      {
        id: newUser._id,
        email: newUser.userEmail,
        type: newUser.userType,
        user_id: newUser.user_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    await sendCredentialsEmail(newUser, generatedPassword);

    await createNotification(
      newUser.user_id,
      "Login details sent",
      "We emailed your login email and password so you can sign in and track your claim."
    );

    return NextResponse.json(
      {
        message: "User registered successfully",
        token,
        user: {
          id: newUser._id,
          email: newUser.userEmail,
          user_id: newUser.user_id,
          type: newUser.userType,
          user_type: "New",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    // 🔹 Verify JWT
    let user;
    try {
      user = verifyToken(req);
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get('user_id');

    if (user_id && !Types.ObjectId.isValid(user_id)) {
      return NextResponse.json(
        { error: 'Invalid user_id format' },
        { status: 400 },
      );
    }
    const caseData = await UserCases.findOne({ user_id }).sort({
      createdAt: -1,
    });
    return NextResponse.json(caseData);
  } catch (error) {
    console.error('GET /api/case error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Decide whether this request is entitled to register the address it names.
 *
 * Two ways to qualify, matching the two ways a claimant reaches the form:
 * signed in as the account that owns the address, or carrying the token this
 * session got back from /api/email-verification/verify. Both are decided from
 * signatures alone, so no database is needed to refuse a request.
 *
 * @returns {{ok: boolean, via?: string, reason?: string}}
 */
function confirmEmailOwnership(req, body, userEmail) {
  // 1. Signed in as the address being registered.
  try {
    const session = verifyToken(req);
    const sessionEmail = normalizeEmail(session?.email);
    if (sessionEmail && sessionEmail === userEmail) {
      return { ok: true, via: 'session' };
    }
  } catch {
    // Not signed in, or the token is stale — fall through to the code path.
  }

  // 2. Verified by emailed code during this visit.
  const token = body?.verification_token || body?.verificationToken;
  const claim = readVerifiedEmailToken(token);

  if (!claim.valid) {
    return { ok: false, reason: claim.reason || 'not_verified' };
  }

  if (claim.email !== userEmail) {
    // The token proves an address; it does not authorise a different one.
    return { ok: false, reason: 'email_mismatch' };
  }

  return { ok: true, via: 'otp' };
}

/**
 * Spend the verification so the same proof is not silently reused later.
 *
 * Bookkeeping only — the signed token is what actually authorised the
 * registration — so a failure here must never fail the request.
 */
async function markVerificationConsumed(userEmail) {
  try {
    await EmailVerification.updateMany(
      { email: userEmail, verified_at: { $ne: null }, consumed_at: null },
      { $set: { consumed_at: new Date() } },
    );
  } catch (error) {
    console.error('[register] could not mark verification consumed', error.message);
  }
}

/**
 * A search identity of this claimant's own.
 *
 * `UserLogin.user_id` is unique, so two accounts cannot share the record a
 * search produced. When the one in the browser is already spoken for — the
 * "use a different email" path lands here every time — the new claimant needs
 * their own, rather than taking over somebody else's account.
 *
 * The details are copied from the search that is already in progress, because
 * that is genuinely this claimant's search; only the identity row is new.
 *
 * @returns {Promise<import('mongoose').Types.ObjectId|null>}
 */
async function cloneSearchIdentity(sourceId) {
  const source = sourceId ? await UserInformation.findById(sourceId).lean() : null;

  const created = await UserInformation.create({
    first_name: source?.first_name || 'Claimant',
    last_name: source?.last_name || 'Unknown',
    address: source?.address || 'Not provided',
    city: source?.city || 'Not provided',
    zip_code: source?.zip_code || '00000',
    state: source?.state || 'CA',
  });

  console.log('[register] created a separate identity for this claimant', {
    from: sourceId ? String(sourceId) : null,
    to: String(created._id),
  });

  await moveSelectedProperties(sourceId, created._id);

  return created._id;
}

/**
 * Bring the properties this visit picked over to the identity that now owns it.
 *
 * The properties are saved while the claimant is choosing them, long before
 * they give an address, so they are filed under whatever identity the search
 * created. When registration has to mint a new identity, the case is opened
 * under the new one and those rows are left behind: the claim then shows no
 * properties at all — no amount, no assets — even though it was filed with
 * them.
 *
 * Only rows no case has taken move. A row already stamped with a case is part
 * of a claim somebody has filed, and that claim keeps it.
 */
async function moveSelectedProperties(fromId, toId) {
  if (!fromId || !toId) return;

  try {
    const result = await UserProperty.updateMany(
      {
        user_id: fromId,
        $or: [{ case_id: null }, { case_id: { $exists: false } }],
      },
      { $set: { user_id: toId } },
    );

    console.log('[register] moved the selected properties to the new identity', {
      from: String(fromId),
      to: String(toId),
      moved: result?.modifiedCount ?? 0,
    });
  } catch (error) {
    // The claim itself is what matters; a bookkeeping failure here must not
    // stop the account being created.
    console.error('[register] could not move selected properties', error.message);
  }
}
