import Groq from 'groq-sdk';
import { NextResponse } from 'next/server';
import { Readable } from 'stream';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Helper to convert ReadableStream to Node.js Stream
function readableStreamToNodeStream(readableStream) {
  return Readable.from(readableStream);
}

export async function POST(request) {
  try {
    const { message } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Create chat completion with streaming
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are Cheshire, a helpful and knowledgeable AI assistant with a playful personality. You provide clear, accurate responses while maintaining a friendly and engaging tone.',
        },
        {
          role: 'user',
          content: message,
        },
      ],
      model: 'deepseek-r1-distill-llama-70b',
      temperature: 0.6,
      max_tokens: 4096,
      top_p: 0.95,
      stream: true,
    });

    // Create a ReadableStream from the streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(new TextEncoder().encode(content));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    // Return the streaming response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
