import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DeskHabits',
  description: 'Discipline builds freedom.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-serif">
        <div className="mx-auto min-h-screen max-w-md bg-ink">{children}</div>
      </body>
    </html>
  );
}
