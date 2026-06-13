import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DeskHabits',
  description: 'Discipline builds freedom.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell" id="app-shell">{children}</div>
      </body>
    </html>
  );
}
