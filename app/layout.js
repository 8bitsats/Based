import './globals.css';

export const metadata = {
  title: 'Test Page',
  description: 'Basic Next.js setup verification',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-black min-h-screen">
        {children}
      </body>
    </html>
  );
}
