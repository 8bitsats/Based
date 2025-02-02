import CheshireChat from './components/CheshireChat';
import RealtimeAudio from './components/RealtimeAudio';
import VideoGenerator from './components/VideoGenerator';

const logos = [
  { src: '/base-symbol-blue.png', alt: 'Base Symbol', className: 'w-12 h-12 animate-pulse' },
  { src: '/dope.png', alt: 'Dope', className: 'w-16 h-16' }
];

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto p-8 space-y-12">
        <header className="text-center mb-12 relative">
          {/* Logos */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center space-x-4">
            {logos.map((logo, index) => (
              <img
                key={index}
                src={logo.src}
                alt={logo.alt}
                className={logo.className}
              />
            ))}
          </div>
          
          <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">
            Based Cheshire Terminal
          </h1>
          <p className="text-lg text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600 font-medium mb-4">
            Powered by Chesh
          </p>
          <p className="text-gray-400">Generate images and videos using voice commands or manual input</p>
        </header>

        <section className="space-y-8">
          <h2 className="text-2xl font-bold mb-6">Voice Commands</h2>
          <RealtimeAudio />
        </section>

        <section className="space-y-8">
          <h2 className="text-2xl font-bold mb-6">Video Generation</h2>
          <VideoGenerator />
        </section>

        <section className="space-y-8">
          <h2 className="text-2xl font-bold mb-6">Based Cheshire Chat</h2>
          <CheshireChat />
        </section>
      </div>
    </main>
  );
}
