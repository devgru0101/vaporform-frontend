import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import { APIProvider } from '@/lib/contexts/APIProvider';
import { SettingsProvider } from '@/lib/contexts/SettingsContext';
import { ToastProvider } from '@/lib/contexts/ToastContext';
import { SettingsModal } from '@/components/settings/SettingsModal';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vaporform - Agentic Development Environment",
  description: "Cloud-based IDE with AI-powered code generation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <APIProvider>
        <ToastProvider>
          <SettingsProvider>
            <html lang="en" className="dark">
              <body
                className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-black text-white`}
              >
                {children}
                <SettingsModal />
              </body>
            </html>
          </SettingsProvider>
        </ToastProvider>
      </APIProvider>
    </ClerkProvider>
  );
}
