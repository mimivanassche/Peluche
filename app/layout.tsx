import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Peluche',
  description: 'Draw a peluche and turn it into a story hero.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
