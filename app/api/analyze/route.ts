import { NextRequest, NextResponse } from 'next/server';
import { fetchGoogleBusinesses, fetchYelpBusinesses, fetchChamberBusinesses, type ProviderBusiness } from '@/lib/providers';
import { summarizeCompany } from '@/lib/scoring';
import { aiSummarizeCompany } from '@/lib/openai';

// Helper function to normalize business names
function normalizedName(name: string) {
  return name.trim().toLowerCase().replace(/[®™]/g, '').replace(/\s+/g, ' ');
}

// Merge businesses to combine data from different sources
async function mergeBusinesses(businesses: ProviderBusiness[]) {
  const byName = new Map<string, ProviderBusiness[]>();

  for (const b of businesses) {
    const key = normalizedName(b.name);
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key)!.push(b);
  }

  const merged: { company: string, sources: any[], summary: any }[] = [];
  for (const [, group] of byName.entries()) {
    const allReviews = group.flatMap(g => (g.reviews ?? []).map(r => ({ ...r, source: g.source })));
    const first = group[0];
    const fallback = summarizeCompany(first.name, allReviews);
    const summary = await aiSummarizeCompany({ company: first.name, reviews: allReviews, fallback });

    // Remove "Limited Data" if no data is available, or show a custom message
    const summaryWithMessage = summary || {
      company: first.name,
      reliabilityScore: 0,
      riskLevel: 'very-high',
      verdict: 'No reviews available.',
      positives: [],
      complaints: [],
      evidenceCount: 0
    };

    merged.push({
      company: first.name,
      sources: group.map(g => ({
        source: g.source,
        rating: g.rating ?? null,
        reviewCount: g.reviewCount ?? null,
        url: g.url ?? null
      })),
      summary: summaryWithMessage
    });
  }

  return merged.sort((a, b) => b.summary.reliabilityScore - a.summary.reliabilityScore);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = {
      query: String(body.query ?? ''),
      city: String(body.city ?? ''),
      postalCode: body.postalCode ? String(body.postalCode) : undefined,
      category: body.category ? String(body.category) : undefined
    };

    if (!input.query || !input.city) {
      return NextResponse.json({ error: 'query and city are required' }, { status: 400 });
    }

    // Fetch data from multiple sources
    const [google, yelp, chamber] = await Promise.all([
      fetchGoogleBusinesses(input),
      fetchYelpBusinesses(input),
      fetchChamberBusinesses(input)
    ]);

    const merged = await mergeBusinesses([...google, ...yelp, ...chamber]);

    return NextResponse.json({
      input,
      providers: {
        google: google.length,
        yelp: yelp.length,
        chamber: chamber.length
      },
      results: merged
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
