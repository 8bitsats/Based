import { NextResponse } from 'next/server';

import { uploadToS3 } from '@/lib/s3';

export async function POST(request) {
  try {
    const { imageUrl, filename } = await request.json();

    if (!imageUrl || !filename) {
      return NextResponse.json(
        { error: 'Image URL and filename are required' },
        { status: 400 }
      );
    }

    const s3Url = await uploadToS3(imageUrl, filename);

    return NextResponse.json({
      success: true,
      url: s3Url
    });

  } catch (error) {
    console.error('Save image error:', error);
    return NextResponse.json(
      { error: 'Failed to save image' },
      { status: 500 }
    );
  }
}
