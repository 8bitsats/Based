import { NextResponse } from 'next/server';
import OpenAI from 'openai';

import { rateLimit } from '@/lib/rate-limit';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize rate limiter
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
  maxRequests: 20, // 20 requests per minute
});

async function generateWithDallE(prompt) {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "vivid",
    });

    return {
      url: response.data[0].url,
      model: 'dall-e-3'
    };
  } catch (error) {
    console.error('DALL-E generation error:', error);
    throw error;
  }
}

async function generateWithHyperbolic(prompt) {
  try {
    const response = await fetch('https://api.hyperbolic.xyz/v1/image/generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.HYPERBOLIC_API_KEY}`,
      },
      body: JSON.stringify({
        'model_name': 'SDXL1.0-base',
        'prompt': prompt,
        'steps': 30,
        'cfg_scale': 5,
        'enable_refiner': false,
        'height': 1024,
        'width': 1024,
        'backend': 'auto'
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Hyperbolic API error');
    }

    const json = await response.json();
    return {
      url: json.images[0],
      model: 'sdxl'
    };
  } catch (error) {
    console.error('Hyperbolic generation error:', error);
    throw error;
  }
}

export async function POST(request) {
  try {
    // Apply rate limiting
    try {
      await limiter.check(20, 'IMAGE_GENERATION');
    } catch {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again in a minute.' },
        { status: 429 }
      );
    }

    const { prompt, model = 'dall-e-3' } = await request.json();

    if (!prompt?.trim()) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log('Starting image generation:', {
      model,
      promptLength: prompt.length,
      timestamp: new Date().toISOString()
    });

    let result;
    try {
      switch (model) {
        case 'dall-e-3':
          result = await generateWithDallE(prompt);
          break;
        case 'sdxl':
          result = await generateWithHyperbolic(prompt);
          break;
        default:
          throw new Error('Invalid model specified');
      }

      console.log('Image generation completed:', {
        model,
        hasResult: !!result?.url,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({
        success: true,
        ...result
      });

    } catch (apiError) {
      console.error(`${model} API error:`, {
        name: apiError.name,
        message: apiError.message,
        code: apiError.code,
        timestamp: new Date().toISOString()
      });

      if (apiError.message?.includes('rate limit')) {
        return NextResponse.json(
          { error: `${model} API rate limit exceeded. Please try again later.` },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { 
          error: 'Failed to generate image',
          details: apiError.message,
          code: apiError.code
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Image generation error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to process image generation request',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
