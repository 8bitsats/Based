'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

export default function RealtimeAudio() {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [sessionTimeout, setSessionTimeout] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Initialize speech recognition on mount
  useEffect(() => {
    let mounted = true;
    
    const checkSupport = () => {
      try {
        if (typeof window === 'undefined') return;
        
        setTimeout(() => {
          if (!mounted) return;
          
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          if (SpeechRecognition) {
            setIsSupported(true);
          } else {
            setError('Speech recognition is not supported in this browser');
          }
        }, 1000);
      } catch (err) {
        console.error('Error checking speech recognition support:', err);
        setError('Failed to initialize speech recognition');
      }
    };

    checkSupport();
    
    return () => {
      mounted = false;
    };
  }, []);

  const processVoiceCommand = async (text) => {
    setIsProcessing(true);
    const lowerText = text.toLowerCase();

    try {
      let response;
      
      if (lowerText.startsWith('search') || lowerText.startsWith('find') || lowerText.startsWith('look up')) {
        // Extract search query
        const query = text.replace(/^(search|find|look up)/i, '').trim();
        console.log('Processing search:', query);
        
        response = await fetch('/api/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query }),
        });

        if (!response.ok) {
          throw new Error('Failed to get search results');
        }

        const data = await response.json();
        setSearchResults(data);
        setGeneratedImage(null); // Clear any previous image

      } else if (lowerText.includes('generate') || lowerText.includes('create')) {
        // Handle image generation
        response = await fetch('/api/realtime', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to get response');
        }

        // Check for generated image
        const imageUrl = response.headers.get('X-Generated-Image');
        if (imageUrl) {
          setGeneratedImage(imageUrl);
          setSearchResults(null); // Clear any previous search results
        }

        // Play audio response
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        await audio.play();
        URL.revokeObjectURL(audioUrl);
      }
    } catch (err) {
      console.error('Failed to process command:', err);
      setError('Failed to process command. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const startListening = useCallback(async () => {
    try {
      if (typeof window === 'undefined') {
        throw new Error('Browser environment not available');
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        throw new Error('Speech recognition is not supported');
      }

      if (!recognitionRef.current) {
        recognitionRef.current = new SpeechRecognition();
      }
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = async (event) => {
        const last = event.results.length - 1;
        const text = event.results[last][0].transcript;
        setTranscript(text);

        if (event.results[last].isFinal) {
          await processVoiceCommand(text);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError('Failed to recognize speech. Please try again.');
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          recognitionRef.current.start();
        }
      };

      // Initialize audio visualization
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      const updateAudioLevel = () => {
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average);
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };
      updateAudioLevel();

      const timeout = setTimeout(() => {
        stopListening();
        setError('Listening session timed out after 5 minutes');
      }, 5 * 60 * 1000);
      setSessionTimeout(timeout);

      recognitionRef.current.start();
      setIsListening(true);
      setError(null);
      setTranscript('');
    } catch (err) {
      console.error('Failed to start listening:', err);
      setError(err.message || 'Failed to start speech recognition');
      setIsListening(false);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
      setSessionTimeout(null);
    }
    
    setIsListening(false);
    setAudioLevel(0);
  }, [sessionTimeout]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  if (!isSupported) {
    return (
      <div className="p-4 bg-gray-900/50 rounded-lg">
        <div className="text-red-500">
          Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-gray-900/50 rounded-lg space-y-2">
        <div className="text-red-500">Error: {error}</div>
        <button
          onClick={() => {
            setError(null);
            setIsListening(false);
            setGeneratedImage(null);
            setSearchResults(null);
            setTranscript('');
            setIsProcessing(false);
          }}
          className="px-4 py-2 bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 text-white rounded-lg transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-900/50 rounded-lg space-y-4">
      <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">
        Voice Commands
      </h2>
      
      <div className="flex items-center space-x-4 relative">
        <div className="relative">
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={isProcessing}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              isListening
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600'
            } ${isProcessing && 'opacity-50 cursor-not-allowed'} text-white`}
          >
            {isListening ? 'Stop Listening' : 'Start Listening'}
          </button>
          
          {isListening && (
            <div className="absolute -right-8 top-1/2 -translate-y-1/2 w-6 h-20 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="absolute bottom-0 w-full bg-gradient-to-t from-green-500 to-green-300 transition-all duration-100"
                style={{ height: `${(audioLevel / 255) * 100}%` }}
              />
            </div>
          )}
        </div>

        {isProcessing && (
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-sky-500"></div>
        )}
      </div>

      {transcript && (
        <div className="mt-4 p-4 bg-black/50 rounded-lg">
          <p className="text-gray-300">{transcript}</p>
        </div>
      )}

      {generatedImage && (
        <div className="mt-4 relative group">
          <img
            src={generatedImage}
            alt="Generated art"
            className="w-full h-auto rounded-lg shadow-lg"
          />
          <button
            onClick={async () => {
              try {
                const filename = `image-${Date.now()}.png`;
                const response = await fetch('/api/save-image', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    imageUrl: generatedImage,
                    filename,
                  }),
                });

                if (!response.ok) {
                  throw new Error('Failed to save image');
                }

                const data = await response.json();
                console.log('Image saved:', data.url);
                alert('Image saved successfully!');
              } catch (error) {
                console.error('Failed to save image:', error);
                alert('Failed to save image. Please try again.');
              }
            }}
            className="absolute bottom-4 right-4 p-3 bg-gray-900/90 hover:bg-gray-800/90 rounded-lg shadow-lg transition-all transform hover:scale-105 opacity-0 group-hover:opacity-100"
            title="Save to S3"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="w-6 h-6 text-blue-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 002-2v-4M17 9l-5 5-5-5M12 12.8V2.5"
              />
            </svg>
          </button>
        </div>
      )}

      {searchResults && (
        <div className="mt-4 space-y-4">
          <div className="p-4 bg-black/50 rounded-lg">
            <p className="text-gray-200 whitespace-pre-wrap">{searchResults.answer}</p>
          </div>

          {searchResults.citations?.length > 0 && (
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Sources:</h3>
              <ul className="space-y-1">
                {searchResults.citations.map((citation, index) => (
                  <li key={index}>
                    <a
                      href={citation}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-400 hover:text-blue-300 break-all"
                    >
                      {citation}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {searchResults.relatedQuestions?.length > 0 && (
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Related Questions:</h3>
              <ul className="space-y-1">
                {searchResults.relatedQuestions.map((question, index) => (
                  <li key={index} className="text-sm text-gray-300">
                    {question}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="text-sm text-gray-400 space-y-2">
        <p>Try saying:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>&ldquo;Generate a cosmic cat&rdquo;</li>
          <li>&ldquo;Create a futuristic city&rdquo;</li>
          <li>&ldquo;Show me trending tokens&rdquo;</li>
          <li>&ldquo;What are the top tokens&rdquo;</li>
        </ul>
        <p className="mt-2 text-xs">Images are generated using DALL-E 3 • Token data from Birdeye API</p>
      </div>
    </div>
  );
}
