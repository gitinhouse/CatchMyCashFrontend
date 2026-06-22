import { NextResponse } from 'next/server';
import { sendEmailTwilio } from '../../lib/sendgrid';

export const runtime = 'nodejs';

const CONTACT_TO_EMAIL =
  process.env.CONTACT_TO_EMAIL || 'misterevancarter@gmail.com';

export async function POST(req) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json(
        { message: 'Name, email, and message are required' },
        { status: 400 },
      );
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      return NextResponse.json(
        { message: 'Please provide a valid email address' },
        { status: 400 },
      );
    }

    const inquirySubject = subject?.trim() || 'General question';
    const mailSubject = `Contact Form: ${inquirySubject}`;

    const text = [
      'New contact form submission',
      '',
      `Name: ${name.trim()}`,
      `Email: ${email.trim()}`,
      `Subject: ${inquirySubject}`,
      '',
      'Message:',
      message.trim(),
    ].join('\n');

    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 30px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
          <div style="background-color: #E1261C; color: #ffffff; text-align: center; padding: 20px 10px;">
            <h1 style="margin: 0; font-size: 24px;">New Contact Form Submission</h1>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333; margin: 0 0 8px;"><strong>Name:</strong> ${name.trim()}</p>
            <p style="font-size: 16px; color: #333; margin: 0 0 8px;"><strong>Email:</strong> ${email.trim()}</p>
            <p style="font-size: 16px; color: #333; margin: 0 0 20px;"><strong>Subject:</strong> ${inquirySubject}</p>
            <p style="font-size: 16px; color: #333; margin: 0 0 8px;"><strong>Message:</strong></p>
            <p style="font-size: 16px; color: #333; white-space: pre-wrap; margin: 0;">${message.trim()}</p>
          </div>
          <div style="background-color: #f1f3f5; text-align: center; padding: 12px; font-size: 12px; color: #888;">
            © ${new Date().getFullYear()} Catch My Cash. All rights reserved.
          </div>
        </div>
      </div>
    `;

    const result = await sendEmailTwilio({
      to: CONTACT_TO_EMAIL,
      subject: mailSubject,
      text,
      html,
      replyTo: email.trim(),
    });

    if (!result.success) {
      return NextResponse.json(
        { message: 'Failed to send email' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('POST /api/contact error:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 },
    );
  }
}
