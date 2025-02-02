'use client';

import {
  useCallback,
  useState,
} from 'react';

export default function VideoGenerator() {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [duration, setDuration] = useState('5');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [requestId, setRequestId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 10;
  const initialRetryDelay = 2000;

  const validateImageUrl = (url) => {
    if (!url) return true; // Optional field
    try {
      new URL(url);
      return url.match(/\.(jpg|jpeg|png|webp)$/i);
    } catch {
      return false;
    }
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setStatus('generating');
    setError(null);
    setVideoUrl(null);

    if (imageUrl && !validateImageUrl(imageUrl)) {
      setError('Please provide a valid image URL (jpg, jpeg, png, or webp)');
      setStatus('error');
      return;
    }

    try {
      setProgress(0);
      setProgressMessage('Initializing video generation...');
      const response = await fetch('/api/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          image_url: imageUrl,
          duration,
          aspect_ratio: aspectRatio,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a few minutes.');
        }
        throw new Error(data.error || 'Failed to generate video');
      }

      setRequestId(data.requestId);
      
      if (data.video) {
        setVideoUrl(data.video.url);
        setStatus('completed');
      } else {
        // Start polling for status
        pollStatus(data.requestId);
      }
    } catch (error) {
      console.error('Video generation error:', error);
      setError(error.message);
      setStatus('error');
    }
  }, [prompt, imageUrl, duration, aspectRatio]);

  const pollStatus = useCallback(async (reqId, retryAttempt = 0) => {
    try {
      // Calculate delay with exponential backoff
      const delay = Math.min(initialRetryDelay * Math.pow(2, retryAttempt), 30000);
      setRetryCount(retryAttempt);
      
      const response = await fetch(`/api/video?requestId=${reqId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check status');
      }

      if (data.status === 'completed' && data.video) {
        setVideoUrl(data.video.url);
        setStatus('completed');
        setProgress(100);
        setProgressMessage('Video generation completed!');
      } else if (data.status === 'failed') {
        setError('Video generation failed');
        setStatus('error');
        setProgress(0);
      } else {
        // Update progress based on status
        if (data.status === 'IN_PROGRESS') {
          setProgress(Math.min(90, retryAttempt * 10)); // Gradual progress up to 90%
          if (data.logs?.length > 0) {
            setProgressMessage(data.logs[data.logs.length - 1].message);
          }
        }

        // Continue polling if within retry limit
        if (retryAttempt < maxRetries) {
          setTimeout(() => pollStatus(reqId, retryAttempt + 1), delay);
        } else {
          setError('Video generation timed out. Please try again.');
          setStatus('error');
          setProgress(0);
        }
      }
    } catch (error) {
      console.error('Status check error:', error);
      setError(error.message);
      setStatus('error');
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold text-white mb-4">Text to Video Generator</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4 relative">
        {status === 'generating' && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center space-y-4 z-10">
            <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-sky-400 to-blue-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-sm text-gray-300 text-center">
              {progressMessage}
              {retryCount > 0 && (
                <div className="text-xs text-gray-400">
                  Attempt {retryCount + 1} of {maxRetries + 1}
                </div>
              )}
            </div>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the video you want to generate..."
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-sky-500 text-white"
            rows={3}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Image URL (Optional)
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-sky-500 text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-sky-500 text-white"
            >
              <option value="5">5 seconds</option>
              <option value="10">10 seconds</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Aspect Ratio
            </label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-sky-500 text-white"
            >
              <option value="16:9">16:9</option>
              <option value="9:16">9:16</option>
              <option value="1:1">1:1</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={status === 'generating'}
          className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
            status === 'generating'
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600'
          } text-white`}
        >
          {status === 'generating' ? 'Generating...' : 'Generate Video'}
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {videoUrl && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-white mb-3">Generated Video</h3>
          <video
            src={videoUrl}
            controls
            className="w-full rounded-lg bg-gray-900"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      {status === 'generating' && !videoUrl && (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
        </div>
      )}
    </div>
  );
}
