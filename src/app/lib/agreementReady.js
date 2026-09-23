import UserDocs from '../models/userDocs';
import UserDetails from '../models/userDetails';
import UserCases from '../models/userCases';
import { sendEmailTwilio } from './sendgrid';
import { createNotification } from './createNotification.js';

const LOG_PREFIX = '[agreement-ready]';

/**
 * Tell a claimant their agreement is ready to sign.
 *
 * The agreement PDF is produced by the automation server, which writes
 * `agreement_doc` straight into the database — nothing in this app runs at the
 * moment it lands. So the notice goes out the first time the app *notices* the
 * document, which is when the signing step asks whether one exists.
 *
 * That makes "only once" the whole problem: the signing step asks repeatedly.
 * The stamp is claimed with a conditional update before the email is composed,
 * so two checks arriving together cannot both win, and a claimant who reloads
 * the page is not mailed again.
 */
export async function notifyAgreementReadyOnce(userDocs) {
  if (!userDocs?.agreement_doc) {
    return { sent: false, reason: 'no_agreement_document' };
  }

  if (userDocs.agreement_ready_notified_at) {
    return { sent: false, reason: 'already_notified' };
  }

  // Claim the right to send. Only the caller whose update matches an
  // un-notified record goes on to send anything.
  const claimed = await UserDocs.findOneAndUpdate(
    { _id: userDocs._id, agreement_ready_notified_at: null },
    { $set: { agreement_ready_notified_at: new Date() } },
    { new: true },
  );

  if (!claimed) {
    return { sent: false, reason: 'already_notified' };
  }

  try {
    const details = await resolveClaimant(claimed);

    if (!details?.email_id) {
      // Nothing to send to. Release the stamp so a later check — by which time
      // the claimant's details may have been filed — can try again.
      await releaseStamp(claimed._id);
      console.error(`${LOG_PREFIX} no email on file`, {
        case_id: String(claimed.case_id || ''),
      });
      return { sent: false, reason: 'missing_email' };
    }

    const kase = claimed.case_id
      ? await UserCases.findById(claimed.case_id).select('case_id').lean()
      : null;

    const result = await sendEmailTwilio({
      to: details.email_id,
      subject: 'Your Agreement is Ready to Sign',
      text: agreementReadyText(details.legal_name, kase?.case_id),
      html: agreementReadyHtml(details.legal_name, kase?.case_id),
    });

    console.log(`${LOG_PREFIX} agreement ready email`, {
      case_id: kase?.case_id || null,
      to: details.email_id,
      success: result?.success === true,
      reason: result?.reason || null,
    });

    if (!result?.success) {
      // The claimant was not told, so the record must not claim they were.
      await releaseStamp(claimed._id);
      return { sent: false, reason: result?.reason || 'send_failed' };
    }

    // In-app notice too, so the bell agrees with the inbox. A failure here is
    // not worth un-sending an email that already went out.
    try {
      if (claimed.user_id) {
        await createNotification(
          claimed.user_id,
          'Agreement ready to sign',
          `Your agreement${kase?.case_id ? ` for ${kase.case_id}` : ''} is ready. Open your claim to review and sign it.`,
        );
      }
    } catch (error) {
      console.error(`${LOG_PREFIX} notification failed`, error.message);
    }

    return { sent: true, to: details.email_id, case_id: kase?.case_id || null };
  } catch (error) {
    await releaseStamp(claimed._id);
    console.error(`${LOG_PREFIX} failed`, error.message);
    return { sent: false, reason: 'error', error: error.message };
  }
}

async function releaseStamp(id) {
  try {
    await UserDocs.updateOne(
      { _id: id },
      { $set: { agreement_ready_notified_at: null } },
    );
  } catch (error) {
    console.error(`${LOG_PREFIX} could not release the stamp`, error.message);
  }
}

/**
 * The claimant's details for this case, falling back to their most recent
 * ones when the documents were filed before details carried a case.
 */
async function resolveClaimant(userDocs) {
  if (userDocs.case_id) {
    const byCase = await UserDetails.findOne({ case_id: userDocs.case_id })
      .sort({ createdAt: -1 })
      .lean();
    if (byCase?.email_id) return byCase;
  }

  if (!userDocs.user_id) return null;

  return UserDetails.findOne({ user_id: userDocs.user_id })
    .sort({ createdAt: -1 })
    .lean();
}

function agreementReadyText(legalName, caseId) {
  return (
    `Hi ${legalName || 'there'},\n\n` +
    `Your investigator agreement is ready to sign.\n\n` +
    (caseId ? `Case ID: ${caseId}\n\n` : '') +
    `Sign in at https://catchmycash.com to review and sign it — your claim ` +
    `cannot be submitted to the State Controller's Office until it is signed.\n\n` +
    `Best Regards,\nCatch My Cash Team`
  );
}

/**
 * The same branded layout the claimant already receives for case messages, so
 * this notice does not arrive looking like it came from somewhere else.
 */
function agreementReadyHtml(legalName, caseId) {
  return `
      <div style="font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 30px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
          <div style="background-color: #4f46e5; color: #ffffff; text-align: center; padding: 20px 10px;">
            <h1 style="margin: 0; font-size: 24px;">Your Agreement is Ready</h1>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333;">Hi ${legalName || 'there'},</p>
            <p style="font-size: 16px; color: #333;">
              Your investigator agreement is ready to sign. Sign in to review and
              sign it — your claim cannot be submitted to the State Controller's
              Office until it is signed.
            </p>
            ${
              caseId
                ? `<table style="width:100%; border-collapse:collapse; margin-top:16px;">
              <tr>
                <td style="padding:10px; border:1px solid #eaeaea; background:#f9fafb;"><strong>Case ID:</strong></td>
                <td style="padding:10px; border:1px solid #eaeaea; font-family:monospace;">${caseId}</td>
              </tr>
            </table>`
                : ''
            }
            <p style="margin-top:24px;">
              <a href="https://catchmycash.com/userLogin"
                 style="background-color:#4f46e5; color:#ffffff; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:bold; display:inline-block;">
                Review and Sign
              </a>
            </p>
            <p style="margin-top: 30px; font-size: 14px; color: #555;">
              Best Regards,<br><strong>Catch My Cash Team</strong>
            </p>
          </div>
          <div style="background-color: #f1f3f5; text-align: center; padding: 12px; font-size: 12px; color: #888;">
            © ${new Date().getFullYear()} Catch My Cash. All rights reserved.
          </div>
        </div>
      </div>
    `;
}
