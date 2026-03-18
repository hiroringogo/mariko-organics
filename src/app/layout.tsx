import type { Metadata, Viewport } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Mariko Organics",
  description: "米粉のお料理教室 - Orange County, CA",
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
      <body className={`${outfit.variable} ${playfair.variable} font-sans antialiased`}>
        <LanguageProvider>
          <div className="mx-auto w-full max-w-lg min-h-screen bg-background shadow-none sm:shadow-xl">
            {children}
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
