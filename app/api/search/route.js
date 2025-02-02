import { NextResponse } from 'next/server';

import { searchWithPerplexity } from '@/lib/perplexity';

export async function POST(request) {
  try {
    const { query } = await request.json();

    if (!query?.trim()) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const searchResult = await searchWithPerplexity(query);

    return NextResponse.json({
      success: true,
      ...searchResult
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to process search request' },
      { status: 500 }
    );
  }
}
