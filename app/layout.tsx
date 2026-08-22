import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AudioUnlock from "@/components/AudioUnlock";
import AnalyticsProvider from "@/components/AnalyticsProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Work-It Workout Tracker",
  description: "6-week workout tracking app with progressive overload, badges, and progress charts",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Work-It",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#07070a',
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#07070a" />
      </head>
      <body className="min-h-full flex flex-col">
        <AudioUnlock />
        <AnalyticsProvider />
        {children}
        {process.env.NODE_ENV === "production" && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.getRegistrations().then(function(regs) {
                  return Promise.all(regs.map(function(reg) { return reg.unregister(); }));
                }).then(function() {
                  if (!window.caches) return;
                  return caches.keys().then(function(keys) {
                    return Promise.all(keys.map(function(key) { return caches.delete(key); }));
                  });
                }).catch(function() {});
              });
            }
          `,
            }}
          />
        )}
      </body>
    </html>
  );
}
