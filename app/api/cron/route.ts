import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_JOBS = [
  { query: 'snow removal', city: 'Laval' },
  { query: 'lawn care', city: 'Laval' }
];

export async function GET(req: NextRequest) {
  const token = req.headers.get('x-analyze-token');
  if (!process.env.ANALYZE_TOKEN || token !== process.env.ANALYZE_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const origin = new URL(req.url).origin;
  const resp = await fetch(`${origin}/api/batch-analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-analyze-token': process.env.ANALYZE_TOKEN
    },
    body: JSON.stringify({ jobs: DEFAULT_JOBS })
  });

  const data = await resp.json();
  return NextResponse.json({ ran: true, ...data });
}
