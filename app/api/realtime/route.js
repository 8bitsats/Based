import Groq from 'groq-sdk';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateImage(prompt) {
  try {
    console.log('Generating image with prompt:', prompt);
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "vivid",
    });

    console.log('DALL-E API response:', response);

    if (!response.data?.[0]?.url) {
      throw new Error('Failed to generate image');
    }

    return {
      id: response.created,
      status: 'succeeded',
      output: response.data[0].url,
      model: 'dall-e-3'
    };
  } catch (error) {
    console.error('Image generation error:', error);
    throw error;
  }
}

async function getAIResponse(text) {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant that helps users generate AI art. When users want to generate images, help them refine their prompts to get better results. Keep your responses concise and friendly.',
        },
        {
          role: 'user',
          content: text,
        },
      ],
      model: 'deepseek-r1-distill-llama-70b',
      temperature: 0.6,
      max_tokens: 200,
      top_p: 0.95,
      stream: false,
    });

    return chatCompletion.choices[0]?.message?.content || 'I\'m not sure how to respond to that.';
  } catch (error) {
    console.error('Groq API error:', error);
    throw error;
  }
}

export async function POST(request) {
  try {
    const { text } = await request.json();
    console.log('Received text for processing:', text);

    if (!text) {
      return NextResponse.json(
        { error: 'Text input is required' },
        { status: 400 }
      );
    }

    // Process voice commands
    const lowerText = text.toLowerCase();
    let responseText = '';
    let prediction = null;

    if (lowerText.includes('trending') || lowerText.includes('top tokens')) {
      try {
        const response = await fetch('http://localhost:3000/api/trending');
        if (!response.ok) {
          throw new Error('Failed to fetch trending tokens');
        }
        
        const data = await response.json();
        const tokens = data.tokens.slice(0, 5); // Get top 5 tokens
        
        responseText = 'Here are the top 5 trending tokens: ';
        tokens.forEach(token => {
          responseText += `${token.name}, symbol ${token.symbol}, at ${token.price} dollars with 24-hour volume of ${token.volume24h} dollars. `;
        });
      } catch (error) {
        console.error('Trending tokens error:', error);
        responseText = 'Sorry, I could not fetch the trending tokens at this moment.';
      }
    } else if (lowerText.includes('generate') || lowerText.includes('create')) {
      // Extract description from command
      const description = lowerText.replace(/generate|create/i, '').trim();
      console.log('Generating image:', { description });

      try {
        // Generate the image
        prediction = await generateImage(description);
        console.log('Generated image:', prediction);
        responseText = `I've generated your image with the prompt: ${description}. The image will appear in a moment.`;

        // Save the image to the gallery
        if (prediction.output) {
          try {
            const { saveImage } = await import('../../lib/prisma.js');
            const imageData = {
              name: description || 'Untitled',
              symbol: '',
              description: '',
              prompt: description,
              imageUrl: prediction.output,
              downloadUrl: prediction.output,
            };
            
            const savedImage = await saveImage(imageData);
            console.log('Image saved to gallery:', savedImage.id);
          } catch (error) {
            console.error('Error saving to gallery:', error);
            // Continue execution even if gallery save fails
          }
        }
      } catch (error) {
        console.error('Image generation error:', error);
        responseText = `Sorry, I couldn't generate the image. ${error.message}`;
      }
    } else {
      // Get AI response for other commands
      responseText = await getAIResponse(text);
    }

    // Call OpenAI's TTS API
    const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: 'alloy',
        input: responseText,
      }),
    });

    if (!ttsResponse.ok) {
      const error = await ttsResponse.json();
      console.error('OpenAI API error:', error);
      throw new Error(error.error?.message || 'Failed to generate speech');
    }

    // Get the audio data as an ArrayBuffer
    const audioData = await ttsResponse.arrayBuffer();

    // Return the audio with appropriate headers and prediction data if available
    const headers = {
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioData.byteLength.toString(),
    };

    if (prediction) {
      headers['X-Prediction-ID'] = prediction.id.toString();
      headers['X-Prediction-Status'] = prediction.status;
      headers['X-Generated-Image'] = prediction.output;
    }

    return new Response(audioData, { headers });
  } catch (error) {
    console.error('Voice command processing error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      {
        error: 'Failed to process voice command',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
