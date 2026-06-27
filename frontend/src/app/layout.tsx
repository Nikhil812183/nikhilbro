import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800']
});

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900']
});

export const metadata: Metadata = {
  title: 'Repeat Order Reminder System | Ganga Maxx Marketplace',
  description: 'Enterprise-grade B2B SaaS dashboard and predictive restock alert automation system for facility supply chains in Telangana.',
  keywords: 'B2B SaaS, Repeat Orders, Ganga Maxx, Facility Supply Chain, Reminder Automation, Predictive Restocks, Telangana Logistics'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth dark">
      <body className={`${inter.variable} ${poppins.variable} font-sans bg-[#F8FAFC] dark:bg-[#0F172A] text-slate-800 dark:text-slate-100 min-h-screen transition-colors duration-300 antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
