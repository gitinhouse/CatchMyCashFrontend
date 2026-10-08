import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Footer from "./components/Footer";
import CookieConsent from "./components/CookieConsent";
import ChatLauncher from "./components/chat/ChatLauncher";
import { SiteHeader } from "./HomeContent";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from "./lib/site";

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
  // Only small labels use it, none of them the first thing a visitor reads, so
  // it should not compete with the display and body fonts for the first
  // bytes. Its metric-matched fallback holds the layout until it arrives.
  preload: false,
});

// Defaults every page inherits. Each public page sets its own title,
// description and canonical URL (see pageMetadata in ./lib/seo), and the
// private ones opt out of indexing (privateMetadata).
export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  category: "finance",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  formatDetection: { telephone: false, address: false, email: false },
  ...(process.env.GOOGLE_SITE_VERIFICATION || process.env.BING_SITE_VERIFICATION
    ? {
        verification: {
          ...(process.env.GOOGLE_SITE_VERIFICATION
            ? { google: process.env.GOOGLE_SITE_VERIFICATION }
            : {}),
          ...(process.env.BING_SITE_VERIFICATION
            ? { other: { "msvalidate.01": process.env.BING_SITE_VERIFICATION } }
            : {}),
        },
      }
    : {}),
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#E1261C",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable}`}
      >
        <SiteHeader/>
        {children}
        <Footer/>
        <ChatLauncher/>
        <CookieConsent/>
      </body>
    </html>
  );
}