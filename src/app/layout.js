import { Geist, Geist_Mono } from "next/font/google";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Footer from "./components/Footer";
import { SiteHeader } from "./HomeContent";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Fonts from HTML mockup
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata = {
  title: "CatchMyCash",
  description: "CatchMyCash",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable}`}
      >
        <SiteHeader/>
        {children}
        <Footer/>
      </body>
    </html>
  );
}