import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const extensionUrl = process.env.EXTENSION_URL;

    if (!extensionUrl) {
      return NextResponse.json(
        { message: 'EXTENSION_URL is not configured' },
        { status: 500 },
      );
    }

    const body = await req.json();

    const response = await fetch(`${extensionUrl}/api/claim-submission`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    console.log('--payload--', body);
    const data = await response.json().catch(() => ({}));
    console.log('--data--', data);
    if (!response.ok) {
      console.error('Error from 3rd party API:', {
        payload: body,
        error: data,
      });
      return NextResponse.json(
        data?.message
          ? { message: data.message, ...data }
          : { message: 'Claim submission failed', ...data },
        { status: response.status },
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('POST /api/claim-submission error:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 },
    );
  }
}
