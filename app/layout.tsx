import './styles.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Review Intelligence MVP',
  description: 'Find and summarize review patterns across supported sources.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
