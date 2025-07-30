import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Layout from "@/components/Layout";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TOTEM Backoffice - UCASAL",
  description: "Sistema de gestión de cronogramas de exámenes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Layout>
          {children}
        </Layout>
        <Toaster 
          position="bottom-right"
          toastOptions={{
            duration: 2000,
            style: {
              fontSize: '14px',
              padding: '8px 12px',
              maxWidth: '400px'
            },
            success: {
              style: {
                background: '#10B981',
                color: 'white',
              },
            },
            error: {
              style: {
                background: '#EF4444', 
                color: 'white',
              },
              duration: 3000,
            }
          }}
        />
      </body>
    </html>
  );
}
