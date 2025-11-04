import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, message, extraHTML = "") => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // ✅ Styled email template with support for extraHTML
    const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 30px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
          <div style="background-color: #4f46e5; color: #ffffff; text-align: center; padding: 20px 10px;">
            <h1 style="margin: 0; font-size: 24px;">Welcome to Our Catch My cash Website 🎉</h1>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333;">${message}</p>
            ${extraHTML || ""}
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

    await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.EMAIL_USER,
      to,
      subject,
      text: message.replace(/<[^>]+>/g, ""), 
      html: htmlTemplate,
    });

    console.log("✅ Styled email sent successfully to:", to);
  } catch (error) {
    console.error("❌ Email send error:", error);
  }
};
