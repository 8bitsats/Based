import { NextResponse } from 'next/server';

import {
  findImages,
  saveImage,
} from '../../lib/prisma.js';

export async function GET() {
  try {
    const images = await findImages();
    return NextResponse.json(images);
  } catch (error) {
    console.error('Failed to fetch images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { url, prompt } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    const imageData = {
      name: prompt || 'Untitled',
      symbol: '',
      description: '',
      prompt,
      imageUrl: url,
      downloadUrl: url,
    };

    const image = await saveImage(imageData);
    return NextResponse.json(image);
  } catch (error) {
    console.error('Failed to save image:', error);
    return NextResponse.json(
      { error: 'Failed to save image' },
      { status: 500 }
    );
  }
}
