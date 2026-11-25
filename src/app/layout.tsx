import type { ReactNode } from 'react';

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
