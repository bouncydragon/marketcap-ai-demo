import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./app.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MarketCap",
  description: "Live prices, market news and your portfolio in one place.",
};

// Runs before first paint so the saved (or system) theme applies without a flash.
const themeScript = `(function(){try{var t=localStorage.getItem('marketcap.theme');if(t!=='dark'&&t!=='light'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
