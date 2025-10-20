/**
 * Server-side proxy for NASA Horizons Lookup API
 * Solves CORS issues by making requests from server instead of browser
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const HORIZONS_LOOKUP_URL = 'https://ssd.jpl.nasa.gov/api/horizons_lookup.api';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sstr = searchParams.get('sstr');
  const group = searchParams.get('group');
  const format = searchParams.get('format') || 'json';

  if (!sstr) {
    return NextResponse.json(
      { error: 'Missing required parameter: sstr' },
      { status: 400 }
    );
  }

  try {
    const params = new URLSearchParams({
      sstr,
      format,
    });

    if (group) {
      params.append('group', group);
    }

    const url = `${HORIZONS_LOOKUP_URL}?${params.toString()}`;
    console.log(`[API Proxy] Fetching from Horizons: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': '3IAtlas-Tracker/1.0',
      },
    });

    if (!response.ok) {
      console.error(`[API Proxy] Horizons returned ${response.status}`);
      return NextResponse.json(
        { error: `Horizons API returned status ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`[API Proxy] Successfully fetched data for "${sstr}"`);

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=86400', // 7 days
      },
    });
  } catch (error) {
    console.error('[API Proxy] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
