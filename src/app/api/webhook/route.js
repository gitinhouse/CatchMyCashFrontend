import { NextResponse } from 'next/server';
import { sendEmailTwilio } from '../../lib/sendgrid';
import connectToDatabase from '../../lib/mongodb';
import UserDetails from '../../models/userDetails';
import mongoose from 'mongoose';

export async function POST(req) {
  try {
    const { userId, subject, errorMessage, properties } = await req.json();

    if (!userId || !subject || !errorMessage) {
      return NextResponse.json(
        { message: 'Missing required fields: userId, subject, errorMessage' },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const userDetails = await UserDetails.findOne({
      user_id: new mongoose.Types.ObjectId(userId),
    });

    if (!userDetails) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Normalize: accept either a single object or an array of properties
    const propertyList = Array.isArray(properties)
      ? properties
      : properties
        ? [properties]
        : [];

    // Brand palette (from catchmycash.com)
    const COLORS = {
      cream: '#f7f4ee',
      white: '#ffffff',
      red: '#c0392b',
      redDark: '#a5312a',
      redPaleBg: '#fbebe9',
      charcoal: '#2c2825',
      textBody: '#4a453f',
      textMuted: '#8a8378',
      border: '#e8e2d6',
    };

    // ---- Build one details card per property ----
    let detailsCards = '';
    propertyList.forEach((property, index) => {
      let rows = '';
      if (property?.address) {
        rows += `
          <tr>
            <td style="padding: 6px 0; color: ${COLORS.textMuted}; font-size: 14px; width: 140px; vertical-align:top; font-family: Arial, Helvetica, sans-serif;">Property Address</td>
            <td style="padding: 6px 0; color: ${COLORS.charcoal}; font-size: 14px; font-weight: 700; font-family: Arial, Helvetica, sans-serif;">${property.address}</td>
          </tr>`;
      }
      if (property?.claimId) {
        rows += `
          <tr>
            <td style="padding: 6px 0; color: ${COLORS.textMuted}; font-size: 14px; width: 140px; vertical-align:top; font-family: Arial, Helvetica, sans-serif;">Claim ID</td>
            <td style="padding: 6px 0; color: ${COLORS.charcoal}; font-size: 14px; font-weight: 700; font-family: Arial, Helvetica, sans-serif;">${property.claimId}</td>
          </tr>`;
      }

      if (rows) {
        detailsCards += `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${COLORS.cream}" style="background-color:${COLORS.cream}; border: 1px solid ${COLORS.border}; border-radius: 8px; margin-bottom: 14px;">
            <tr>
              <td style="padding: 16px 20px;">
                ${
                  propertyList.length > 1
                    ? `
                <p style="margin:0 0 10px; color:${COLORS.red}; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; font-family: Arial, Helvetica, sans-serif;">
                  Property ${index + 1}
                </p>`
                    : ''
                }
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${rows}
                </table>
              </td>
            </tr>
          </table>`;
      }
    });

    // ---- Dynamic HTML email ----
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <!--[if mso]>
      <style type="text/css">
        table { border-collapse: collapse; }
      </style>
      <![endif]-->
    </head>
    <body style="margin:0; padding:0; background-color:${COLORS.cream}; font-family: Arial, Helvetica, sans-serif;">
      <center style="width:100%; background-color:${COLORS.cream};">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" bgcolor="${COLORS.cream}" style="background-color:${COLORS.cream};">
          <tr>
            <td align="center" style="padding: 32px 16px;">

              <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center" bgcolor="${COLORS.white}" style="width:600px; max-width:600px; background-color:${COLORS.white}; border-radius: 12px; overflow:hidden;">

                <!-- Header banner -->
                <tr>
                  <td align="left" bgcolor="${COLORS.red}" style="background-color:${COLORS.red}; padding: 28px 32px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                         
                          <h1 style="margin: 14px 0 0; color:${COLORS.white}; font-size: 24px; font-weight: 700; font-family: Georgia, 'Times New Roman', serif;">
                            Claim Submission Failed
                          </h1>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td bgcolor="${COLORS.white}" style="background-color:${COLORS.white}; padding: 32px;">
                    <p style="margin:0 0 16px; color:${COLORS.textBody}; font-size:15px; line-height:1.6; font-family: Arial, Helvetica, sans-serif;">
                      Dear User,
                    </p>
                    <p style="margin:0 0 20px; color:${COLORS.textBody}; font-size:15px; line-height:1.6; font-family: Arial, Helvetica, sans-serif;">
                      We regret to inform you that there was an issue processing your recent property claim submission.
                    </p>

                    <!-- Error box -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${COLORS.redPaleBg}" style="background-color:${COLORS.redPaleBg}; border-radius: 6px; margin-bottom: 24px;">
                      <tr>
                        <td width="4" bgcolor="${COLORS.red}" style="background-color:${COLORS.red}; padding:0;"></td>
                        <td style="padding: 16px 20px;">
                          <p style="margin:0 0 6px; color:${COLORS.redDark}; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; font-family: Arial, Helvetica, sans-serif;">
                            Error Details
                          </p>
                          <p style="margin:0; color:${COLORS.redDark}; font-size:15px; font-weight:600; line-height:1.5; font-family: Arial, Helvetica, sans-serif;">
                            ${errorMessage}
                          </p>
                        </td>
                      </tr>
                    </table>

                    ${detailsCards}

                    <p style="margin:0; color:${COLORS.textBody}; font-size:15px; line-height:1.6; font-family: Arial, Helvetica, sans-serif;">
                      Please review the details above carefully and confirm they are correct. If anything looks incorrect or you have questions, please reach out to our support team before resubmitting.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td bgcolor="${COLORS.cream}" style="background-color:${COLORS.cream}; padding: 24px 32px; border-top: 1px solid ${COLORS.border};">
                    <p style="margin:0; color:${COLORS.textMuted}; font-size:13px; line-height:1.5; font-family: Arial, Helvetica, sans-serif;">
                      Sincerely,<br/>
                      <strong style="color:${COLORS.charcoal};">The CatchMyCash Team</strong>
                    </p>
                  </td>
                </tr>

              </table>

            </td>
          </tr>
        </table>
      </center>
    </body>
    </html>
    `;

    // ---- Plain text fallback ----
    let textContent = `
Dear User,

We regret to inform you that there was an issue processing your recent property claim submission.

Error Details:
${errorMessage}
`;

    propertyList.forEach((property, index) => {
      if (property?.address || property?.claimId) {
        textContent +=
          propertyList.length > 1 ? `\nProperty ${index + 1}:` : '';
        if (property?.address)
          textContent += `\nProperty Address: ${property.address}`;
        if (property?.claimId) textContent += `\nClaim ID: ${property.claimId}`;
        textContent += '\n';
      }
    });

    textContent += `
Please review the details above carefully and confirm they are correct. If anything looks incorrect or you have questions, please reach out to our support team before resubmitting.

Sincerely,
The CatchMyCash Team
`;

    await sendEmailTwilio({
      to: userDetails.email_id,
      subject: subject,
      text: textContent,
      html: htmlContent,
    });

    return NextResponse.json(
      { message: 'Failure notification email sent successfully' },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error sending failure notification email:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
