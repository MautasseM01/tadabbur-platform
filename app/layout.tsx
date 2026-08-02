import type { Metadata } from 'next';
import { Inter, Amiri } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const amiri = Amiri({ 
  weight: ['400', '700'],
  subsets: ['arabic', 'latin'], 
  variable: '--font-amiri' 
});

export const metadata: Metadata = {
  title: 'Tadabbur Platform - منصة التدبر',
  description: 'Interactive Quranic Web Application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={`${inter.variable} ${amiri.variable}`}>
      <body className="font-sans min-h-screen anti-aliased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
