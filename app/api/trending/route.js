import { NextResponse } from 'next/server';

async function fetchTrendingTokens() {
  try {
    const response = await fetch(
      'https://public-api.birdeye.so/defi/token_trending?sort_by=rank&sort_type=asc&offset=0&limit=20',
      {
        headers: {
          'X-API-KEY': process.env.BIRDEYE_API_KEY,
          'accept': 'application/json',
          'x-chain': 'base'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch trending tokens');
    }

    const data = await response.json();
    return data.data.tokens;
  } catch (error) {
    console.error('Error fetching trending tokens:', error);
    throw error;
  }
}

export async function GET() {
  try {
    const tokens = await fetchTrendingTokens();
    
    // Format tokens for speech
    const formattedTokens = tokens.map(token => ({
      rank: token.rank,
      name: token.name,
      symbol: token.symbol,
      price: token.price.toFixed(6),
      volume24h: Math.round(token.volume24hUSD).toLocaleString()
    }));

    return NextResponse.json({
      success: true,
      tokens: formattedTokens
    });
  } catch (error) {
    console.error('Failed to get trending tokens:', error);
    return NextResponse.json(
      { error: 'Failed to get trending tokens' },
      { status: 500 }
    );
  }
}
