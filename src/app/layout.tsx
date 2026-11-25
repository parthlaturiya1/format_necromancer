import type { ReactNode } from 'react';
import '../ui/tokens.css';
import '../ui/shell.css';

export const metadata = {
  title: 'Format Necromancer',
  description: 'Recover a dead file format from bytes alone, in your browser.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
