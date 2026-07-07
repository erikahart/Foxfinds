import type { Metadata, Viewport } from "next";
import "./globals.css";
import PWARegister from "@/components/PWARegister";

export const metadata: Metadata = {
  title: "Fox Finds — resell your storage-unit finds",
  description:
    "Snap a photo, let AI identify and price the find, and generate listings for every marketplace.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Fox Finds", statusBarStyle: "default" },
  icons: { icon: "/favicon.png", apple: "/icon-180.png" },
};

export const viewport: Viewport = {
  themeColor: "#211E1A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..600&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">
        {children}
        <PWARegister />
      </body>
    </html>
  );
}