import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AudioUnlock from "@/components/AudioUnlock";
import AnalyticsProvider from "@/components/AnalyticsProvider";
import FeedbackWidget from "@/components/FeedbackWidget";
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
        {/* app/icon.svg already auto-generates the SVG favicon tag. The
            apple-touch-icon must stay a plain, query-string-free URL: iOS
            Safari's Add to Home Screen icon fetch silently fails on a
            hashed "?..." URL (which is what Next's own app/apple-icon.png
            convention would produce) and falls back to a plain letter tile. */}
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
        <FeedbackWidget />
        {process.env.NODE_ENV === "production" && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
            (function () {
              var KEY = 'workit_css_reload';
              function clearAndReload() {
                if (sessionStorage.getItem(KEY)) return;
                sessionStorage.setItem(KEY, '1');
                var done = function () { location.reload(); };
                var chain = Promise.resolve();
                if ('serviceWorker' in navigator) {
                  chain = navigator.serviceWorker.getRegistrations().then(function (regs) {
                    return Promise.all(regs.map(function (reg) { return reg.unregister(); }));
                  });
                }
                chain.then(function () {
                  if (!window.caches) return;
                  return caches.keys().then(function (keys) {
                    return Promise.all(keys.map(function (key) { return caches.delete(key); }));
                  });
                }).then(done).catch(done);
              }
              function sheetDead() {
                var bg = getComputedStyle(document.body).backgroundColor;
                return bg === 'rgba(0, 0, 0, 0)' || bg === 'rgb(255, 255, 255)';
              }
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function (regs) {
                  return Promise.all(regs.map(function (reg) { return reg.unregister(); }));
                }).then(function () {
                  if (!window.caches) return;
                  return caches.keys().then(function (keys) {
                    return Promise.all(keys.map(function (key) { return caches.delete(key); }));
                  });
                }).catch(function () {});
              }
              document.querySelectorAll('link[rel="stylesheet"]').forEach(function (link) {
                link.addEventListener('error', clearAndReload);
                fetch(link.href, { cache: 'no-store', method: 'HEAD' }).then(function (res) {
                  if (!res.ok) clearAndReload();
                }).catch(clearAndReload);
              });
              setTimeout(function () {
                if (sheetDead()) clearAndReload();
              }, 400);
            })();
          `,
            }}
          />
        )}
      </body>
    </html>
  );
}
