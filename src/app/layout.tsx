import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'RecallFlow | Privacy-Aware Voice Meeting & Knowledge Copilot',
  description: 'Voice-first meeting memory powered by Omi ingestion, Qdrant vector memory, and Lyzr multi-agent intelligence.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-sky-500/30 selection:text-sky-200">
        {children}
      </body>
    </html>
  );
}
