import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import siteMetadata from "./metadata.json";

export const metadata: Metadata = {
  title: siteMetadata.app.title,
  description: siteMetadata.app.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={siteMetadata.layout.lang}>
      <head>
        <meta charSet={siteMetadata.layout.charset} />
        <meta name="viewport" content={siteMetadata.layout.viewport} />
        {/* Preconnect to Google Fonts if we use them later */}
        {siteMetadata.layout.preconnect.map((url, idx) => (
          <link key={idx} rel="preconnect" href={url} />
        ))}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href={siteMetadata.layout.fontUrl} rel="stylesheet" />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
