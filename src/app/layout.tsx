import type { Metadata, Viewport } from "next";
import { Outfit, Playfair_Display, Kalam } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["700", "900"],
});

const kalam = Kalam({
  variable: "--font-kalam",
  subsets: ["latin"],
  weight: ["700"],
});

export const metadata: Metadata = {
  title: "Mariko Organics",
  description: "グルテンフリー料理教室 - Orange County, CA",
  appleWebApp: {
    capable: true,
    title: "Mariko Organics",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${outfit.variable} ${playfair.variable} ${kalam.variable} font-sans antialiased`}>
        <LanguageProvider>
          <div className="mx-auto w-full max-w-lg min-h-screen bg-background shadow-none sm:shadow-xl">
            {children}
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
