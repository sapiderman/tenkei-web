import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // This URL is now hidden from the client browser
  // For even better security, store this in an environment variable (e.g. process.env.REI_API_URL)
  const TARGET_API_URL = process.env.REI_API_URL || 'example.com/api/register';

  try {
    const body = await request.json();

    const response = await fetch(TARGET_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Handle non-JSON responses gracefully
    const data = await response.json().catch(() => ({}));

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Registration proxy error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during registration.' },
      { status: 500 }
    );
  }
}
