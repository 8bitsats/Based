import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { prompt } = await request.json();
    console.log('Received prompt:', prompt);

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
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

    if (!process.env.CHESHIRE_MODEL_VERSION) {
      console.error('CHESHIRE_MODEL_VERSION is not set');
      return NextResponse.json(
        { error: 'Model version is not configured' },
        { status: 500 }
      );
    }

    console.log('Making request to Replicate API...');
    // Call Replicate API to generate image
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: process.env.CHESHIRE_MODEL_VERSION,
        input: {
          prompt: prompt,
          model: "dev",
          negative_prompt: "ugly, disfigured, low quality, blurry, nsfw",
          num_inference_steps: 28,
          guidance_scale: 3,
          output_format: "webp",
          num_outputs: 1,
          aspect_ratio: "1:1",
          megapixels: "1",
          go_fast: false,
        },
      }),
    });

    const responseText = await response.text();
    console.log('Replicate API response:', responseText);

    if (!response.ok) {
      console.error('Replicate API error:', responseText);
      return NextResponse.json(
        { error: 'Failed to generate image', details: responseText },
        { status: response.status }
      );
    }

    const prediction = JSON.parse(responseText);
    console.log('Created prediction:', prediction);

    return NextResponse.json({
      id: prediction.id,
      status: prediction.status,
    });
  } catch (error) {
    console.error('Prompt API error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      {
        error: 'Failed to generate image',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
