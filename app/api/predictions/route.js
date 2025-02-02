import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.DIGITAL_OCEAN_HOST);
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};
 
const WEBHOOK_HOST = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NGROK_HOST;
 
export async function POST(request) {
  try {
    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: 'Replicate API token is not configured' },
        { status: 500 }
      );
    }

    const { prompt, name, symbol, description } = await request.json();

    if (!prompt || !name || !symbol || !description) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }
 
    const options = {
      version: "98f0b02481857e06acf8e0f001f533d6a5c1171280e2f630d3cdeacf477496ec",
      input: { 
        prompt,
        negative_prompt: "ugly, blurry, low quality, distorted, disfigured",
        num_inference_steps: 50,
        guidance_scale: 7.5,
        scheduler: "K_EULER",
        num_outputs: 1
      }
    }
 
    if (WEBHOOK_HOST) {
      options.webhook = `${WEBHOOK_HOST}/api/webhooks/route`;
      options.webhook_events_filter = ["start", "completed"];
    }
 
    const prediction = await replicate.predictions.create(options);
 
    if (prediction?.error) {
      return NextResponse.json(
        { detail: prediction.error },
        { status: 500 }
      );
    }

    // Image will be saved to gallery by the webhook when the prediction is complete
 
    return NextResponse.json(prediction, { status: 201 });
  } catch (error) {
    console.error('Prediction error:', error);
    return NextResponse.json(
      { detail: error.message || 'Failed to create prediction' },
      { status: 500 }
    );
  }
}
