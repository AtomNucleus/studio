import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Added Toaster

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans', // Set Inter as --font-sans
});

export const metadata: Metadata = {
  title: 'VisionSpend',
  description: 'Track your spending with a Vision Pro inspired interface.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
