import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    console.log('Fetching prediction status for:', id);

    if (!id) {
      return NextResponse.json(
        { error: 'Prediction ID is required' },
        { status: 400 }
      );
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      console.error('REPLICATE_API_TOKEN is not set');
      return NextResponse.json(
        { error: 'Replicate API token is not configured' },
        { status: 500 }
      );
    }

    console.log('Making request to Replicate API...');
    const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const responseText = await response.text();
    console.log('Replicate API response:', responseText);

    if (!response.ok) {
      console.error('Replicate API error:', responseText);
      return NextResponse.json(
        { error: 'Failed to get prediction status', details: responseText },
        { status: response.status }
      );
    }

    const prediction = JSON.parse(responseText);
    console.log('Prediction status:', prediction.status);

    // Return the prediction data
    return NextResponse.json({
      id: prediction.id,
      status: prediction.status,
      output: prediction.output?.[0] || null,
      error: prediction.error,
      logs: prediction.logs,
      metrics: prediction.metrics,
      created_at: prediction.created_at,
      started_at: prediction.started_at,
      completed_at: prediction.completed_at,
      urls: prediction.urls,
      version: prediction.version,
    });
  } catch (error) {
    console.error('Prediction status error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      {
        error: 'Failed to get prediction status',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
