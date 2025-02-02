import crypto from 'crypto';
import { NextResponse } from 'next/server';

function verifySignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(`sha256=${digest}`),
    Buffer.from(signature)
  );
}

export async function POST(request) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('replicate-webhook-signature');

    // Verify webhook signature
    if (!verifySignature(payload, signature, process.env.REPLICATE_WEBHOOK_SIGNING_KEY)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(payload);
    console.log('Webhook event:', event);

    // Handle prediction completion
    if (event.status === 'succeeded') {
      console.log('Prediction succeeded:', {
        id: event.id,
        output: event.output,
        metrics: event.metrics,
      });

      // Save the image to the gallery
      if (event.output?.[0]) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/gallery`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: event.output[0],
            prompt: event.input.prompt,
          }),
        });

        if (!response.ok) {
          console.error('Failed to save image to gallery:', await response.text());
        } else {
          console.log('Image saved to gallery');
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}
