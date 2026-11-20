import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Domino Sky – AI Airline Disruption Simulator',
  description: 'AI-Powered Airline Disruption Simulator and Decision-Support Command Center for Prompt War 2026',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-aviation-darkest text-slate-100 min-h-screen antialiased selection:bg-aviation-cyan selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
