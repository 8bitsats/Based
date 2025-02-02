import { NextResponse } from 'next/server';

import { rateLimit } from '@/lib/rate-limit';
import { fal } from '@fal-ai/client';

if (!process.env.FAL_API_KEY) {
  throw new Error('FAL_API_KEY is required');
}

fal.config({
  credentials: process.env.FAL_API_KEY
});

// Initialize rate limiter
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
  maxRequests: 10, // 10 requests per minute
});

// Helper to validate input
const validateInput = (input) => {
  const errors = [];
  
  if (!input.prompt?.trim()) {
    errors.push('Prompt is required');
  }
  
  if (input.image_url) {
    try {
      new URL(input.image_url);
    } catch {
      errors.push('Invalid image URL format');
    }
  }
  
  if (input.duration && !['5', '10'].includes(input.duration)) {
    errors.push('Duration must be 5 or 10 seconds');
  }
  
  if (input.aspect_ratio && !['16:9', '9:16', '1:1'].includes(input.aspect_ratio)) {
    errors.push('Invalid aspect ratio');
  }
  
  return errors;
};

export async function POST(request) {
  try {
    // Apply rate limiting
    try {
      await limiter.check(10, 'VIDEO_GENERATION');
    } catch {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again in a minute.' },
        { status: 429 }
      );
    }

    const input = await request.json();
    const validationErrors = validateInput(input);
    
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: validationErrors.join(', ') },
        { status: 400 }
      );
    }

    const { prompt, image_url, duration = "5", aspect_ratio = "16:9" } = input;

    try {
      console.log('Starting video generation:', {
        prompt,
        hasImageUrl: !!image_url,
        duration,
        aspect_ratio
      });

      const result = await fal.subscribe("fal-ai/kling-video/v1.5/pro/image-to-video", {
        input: {
          prompt,
          image_url,
          duration,
          aspect_ratio
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            const messages = update.logs.map((log) => log.message);
            console.log("Processing video:", {
              status: update.status,
              messages,
              timestamp: new Date().toISOString()
            });
          }
        },
      });

      console.log('Video generation completed:', {
        requestId: result.requestId,
        hasVideo: !!result.data?.video,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({
        success: true,
        video: result.data.video,
        requestId: result.requestId
      });

    } catch (falError) {
      console.error('FAL API error:', {
        name: falError.name,
        message: falError.message,
        code: falError.code,
        timestamp: new Date().toISOString()
      });

      // Handle specific FAL API errors
      if (falError.message?.includes('rate limit')) {
        return NextResponse.json(
          { error: 'FAL API rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { 
          error: 'Failed to generate video',
          details: falError.message,
          code: falError.code
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Video generation error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to process video generation request',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }

    console.log('Checking video status:', {
      requestId,
      timestamp: new Date().toISOString()
    });

    try {
      const status = await fal.queue.status("fal-ai/kling-video/v1.5/pro/image-to-video", {
        requestId,
        logs: true,
      });

      console.log('Video status result:', {
        requestId,
        status: status.status,
        hasLogs: !!status.logs?.length,
        timestamp: new Date().toISOString()
      });

      if (status.status === 'COMPLETED') {
        const result = await fal.queue.result("fal-ai/kling-video/v1.5/pro/image-to-video", {
          requestId
        });

        console.log('Retrieved completed video:', {
          requestId,
          hasVideo: !!result.data?.video,
          timestamp: new Date().toISOString()
        });

        return NextResponse.json({
          status: 'completed',
          video: result.data.video
        });
      }

      return NextResponse.json({
        status: status.status,
        logs: status.logs
      });
    } catch (falError) {
      console.error('FAL API status check error:', {
        requestId,
        name: falError.name,
        message: falError.message,
        code: falError.code,
        timestamp: new Date().toISOString()
      });

      throw falError;
    }

  } catch (error) {
    console.error('Video status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check video status' },
      { status: 500 }
    );
  }
}
