import type { Metadata } from "next";
import { Noto_Sans_TC, Noto_Serif_TC, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/context";
import { ThemeProvider } from "@/lib/theme/context";
import { AudioProvider } from "@/lib/audio/context";

const notoSans = Noto_Sans_TC({
  variable: "--font-sans-tc",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const notoSerif = Noto_Serif_TC({
  variable: "--font-serif-tc",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const robotoMono = Roboto_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "粵語漢字學習系統 | Cantonese Hanzi Learning",
  description: "香港小學中文字互動學習平台 | HK Primary School Chinese Learning Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-HK">
      <body
        className={`${notoSans.variable} ${notoSerif.variable} ${robotoMono.variable} antialiased`}
      >
        <ThemeProvider>
          <LanguageProvider>
            <AudioProvider>
              {children}
            </AudioProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
