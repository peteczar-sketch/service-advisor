export type SearchInput = {
  query: string;
  city: string;
  postalCode?: string;
  category?: string;
};

export type ProviderBusiness = {
  source: 'google' | 'yelp' | 'chamber';
  sourceId: string;
  name: string;
  rating?: number | null;
  reviewCount?: number | null;
  url?: string | null;
  reviews?: Array<{ rating?: number | null; text: string; date?: string | null }>;
};

export async function fetchGoogleBusinesses(input: SearchInput): Promise<ProviderBusiness[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return [];

  const textQuery = `${input.query} in ${input.city}`;
  const textResp = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount'
    },
    body: JSON.stringify({ textQuery, languageCode: 'en' })
  });

  if (!textResp.ok) throw new Error(`Google search failed: ${textResp.status}`);
  const textJson = await textResp.json();
  const places = textJson.places ?? [];

  const out: ProviderBusiness[] = [];
  for (const p of places.slice(0, 8)) {
    const detailResp = await fetch(`https://places.googleapis.com/v1/places/${p.id}`, {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'id,displayName,rating,userRatingCount,reviews,googleMapsUri'
      }
    });
    if (!detailResp.ok) continue;
    const d = await detailResp.json();
    out.push({
      source: 'google',
      sourceId: d.id,
      name: d.displayName?.text ?? 'Unknown',
      rating: d.rating ?? null,
      reviewCount: d.userRatingCount ?? null,
      url: d.googleMapsUri ?? null,
      reviews: (d.reviews ?? []).map((r: any) => ({
        rating: r.rating ?? null,
        text: r.originalText?.text ?? r.text?.text ?? '',
        date: r.publishTime ?? null
      }))
    });
  }

  return out;
}

export async function fetchYelpBusinesses(input: SearchInput): Promise<ProviderBusiness[]> {
  const apiKey = process.env.YELP_API_KEY;
  if (!apiKey) return [];

  const url = new URL('https://api.yelp.com/v3/businesses/search');
  url.searchParams.set('location', `${input.city}${input.postalCode ? ` ${input.postalCode}` : ''}`);
  url.searchParams.set('term', input.query);
  url.searchParams.set('limit', '8');

  const searchResp = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  if (!searchResp.ok) throw new Error(`Yelp search failed: ${searchResp.status}`);
  const searchJson = await searchResp.json();
  const businesses = searchJson.businesses ?? [];

  const out: ProviderBusiness[] = [];
  for (const b of businesses) {
    const reviewsResp = await fetch(`https://api.yelp.com/v3/businesses/${b.id}/reviews`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    let reviews: Array<{ rating?: number | null; text: string; date?: string | null }> = [];
    if (reviewsResp.ok) {
      const reviewsJson = await reviewsResp.json();
      reviews = (reviewsJson.reviews ?? []).map((r: any) => ({
        rating: r.rating ?? null,
        text: r.text ?? '',
        date: r.time_created ?? null
      }));
    }
    out.push({
      source: 'yelp',
      sourceId: b.id,
      name: b.name,
      rating: b.rating ?? null,
      reviewCount: b.review_count ?? null,
      url: b.url ?? null,
      reviews
    });
  }

  return out;
}

export async function fetchChamberBusinesses(_input: SearchInput): Promise<ProviderBusiness[]> {
  return [];
}
