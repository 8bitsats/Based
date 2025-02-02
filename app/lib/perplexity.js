const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const API_URL = 'https://api.perplexity.ai/chat/completions';

export async function searchWithPerplexity(query) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant that provides clear, accurate, and concise answers. Include relevant citations when possible.',
          },
          {
            role: 'user',
            content: query,
          },
        ],
        temperature: 0.2,
        top_p: 0.9,
        return_images: true,
        return_related_questions: true,
        search_recency_filter: 'month',
        stream: false,
        presence_penalty: 0,
        frequency_penalty: 1,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get response from Perplexity API');
    }

    const data = await response.json();
    return {
      answer: data.choices[0]?.message?.content || 'No answer found',
      citations: data.citations || [],
      relatedQuestions: data.related_questions || [],
      images: data.choices[0]?.message?.images || [],
    };
  } catch (error) {
    console.error('Perplexity API error:', error);
    throw error;
  }
}
