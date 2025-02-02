'use client';

import {
  useEffect,
  useState,
} from 'react';

import Image from 'next/image';

export default function Gallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await fetch('/api/gallery');
      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }
      const data = await response.json();
      setImages(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch images:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="text-red-500 text-center p-4 bg-gray-900/50 rounded-lg">
        <p>Error loading gallery: {error}</p>
        <button
          onClick={fetchImages}
          className="mt-2 px-4 py-2 bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 text-white rounded-lg transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (!images || images.length === 0) {
    return (
      <div className="text-gray-400 text-center p-4">
        No images generated yet. Try using voice commands to create some art!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {images.map((image) => (
        <div
          key={image.id}
          className="relative group bg-gray-900/50 rounded-lg overflow-hidden transition-all hover:scale-[1.02]"
        >
          <div className="aspect-square relative">
            <Image
              src={image.imageUrl}
              alt={image.prompt || image.name || 'Generated art'}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              priority={false}
              onError={(e) => {
                console.error('Failed to load image:', image.imageUrl);
                e.target.src = '/base.svg'; // Fallback image
              }}
            />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-sm text-gray-200">
              {image.prompt || image.name || 'Generated art'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(image.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
