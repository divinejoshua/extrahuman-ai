import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://tabseditor.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Tabs Editor - AI Text Paraphraser & Humanizer",
    template: "%s | Tabs Editor",
  },
  description:
    "Paraphrase, humanize, and rewrite your text instantly with AI. Tabs Editor is a powerful AI paraphraser and text humanizer that transforms your content while keeping it natural.",
  keywords: [
    "AI paraphraser",
    "text humanizer",
    "AI rewriter",
    "paraphrase tool",
    "humanize AI text",
    "text transformer",
    "content rewriter",
  ],
  authors: [{ name: "Tabs Editor" }],
  creator: "Tabs Editor",
  category: "Technology",
  applicationName: "Tabs Editor",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Tabs Editor - AI Text Paraphraser & Humanizer",
    description:
      "Paraphrase, humanize, and rewrite your text instantly with AI. Transform your content while keeping it natural.",
    url: siteUrl,
    siteName: "Tabs Editor",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Tabs Editor - AI Text Paraphraser & Humanizer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tabs Editor - AI Text Paraphraser & Humanizer",
    description:
      "Paraphrase, humanize, and rewrite your text instantly with AI.",
    images: ["/opengraph-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var theme = localStorage.getItem('theme');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-T4L55BYH3B"
        strategy="lazyOnload"
      />
      <Script id="google-analytics" strategy="lazyOnload">
        {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-T4L55BYH3B');
              `}
      </Script>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebApplication",
                  name: "Tabs Editor",
                  description:
                    "Paraphrase, humanize, and rewrite your text instantly with AI.",
                  url: siteUrl,
                  applicationCategory: "UtilitiesApplication",
                  operatingSystem: "All",
                  offers: {
                    "@type": "Offer",
                    price: "0",
                    priceCurrency: "USD",
                  },
                },
                {
                  "@type": "Organization",
                  name: "Tabs Editor",
                  url: siteUrl,
                },
              ],
            }),
          }}
        />
        <ClerkProvider dynamic>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
