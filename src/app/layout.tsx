import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ChatStateProvider } from "@/components/chat-state-provider";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

const siteUrl = "https://krutim.uxsumit.com";
const siteName = "Krutim";
const siteDescription =
  "Krutim is a multi-model AI chat platform. Chat with multiple AI models, compare responses, switch between providers, and monitor model availability in real time.";
const siteKeywords = [
  "AI chat",
  "multi-model AI",
  "Krutim",
  "LLM chat",
  "AI assistant",
  "chatbot",
  "GPT",
  "Claude",
  "Gemini",
  "AI model comparison",
  "AI model status",
  "real-time AI",
  "conversational AI",
  "AI platform",
  "machine learning chat",
];

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Krutim - Multi-Model AI Chat",
    template: "%s | Krutim",
  },
  description: siteDescription,
  keywords: siteKeywords,
  authors: [{ name: "Sumit", url: siteUrl }],
  creator: "Sumit",
  publisher: "Krutim",
  applicationName: siteName,
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  category: "technology",

  // Canonical
  alternates: {
    canonical: siteUrl,
  },

  // Open Graph
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName,
    title: "Krutim - Multi-Model AI Chat",
    description: siteDescription,
    images: [
      {
        url: `${siteUrl}/krutim-logo.svg`,
        width: 114,
        height: 87,
        alt: "Krutim Logo",
        type: "image/svg+xml",
      },
    ],
  },

  // Twitter / X
  twitter: {
    card: "summary",
    title: "Krutim - Multi-Model AI Chat",
    description: siteDescription,
    images: [`${siteUrl}/krutim-logo.svg`],
  },

  // Robots / Crawlers
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Icons - generated via icon.tsx and apple-icon.tsx
  icons: {
    icon: "/icon",
    apple: "/apple-icon",
  },

  // Verification (add your IDs when available)
  // verification: {
  //   google: "your-google-site-verification",
  // },

  // Other meta
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": siteName,
    "mobile-web-app-capable": "yes",
  },
};

// JSON-LD structured data for search engines and AI agents
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: siteName,
  url: siteUrl,
  description: siteDescription,
  applicationCategory: "ChatApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires a modern web browser",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  author: {
    "@type": "Person",
    name: "Sumit",
    url: siteUrl,
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${siteUrl}/chat`,
    },
    description: "Chat with multiple AI models",
  },
  featureList: [
    "Multi-model AI chat",
    "Real-time model status monitoring",
    "Model switching and comparison",
    "Streaming responses",
    "Markdown and code rendering",
    "Math equation support (LaTeX/KaTeX)",
    "Mermaid diagram rendering",
    "Dark mode and light mode",
    "Mobile-first responsive design",
    "Thinking/reasoning display",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
        <meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1A1A1A" media="(prefers-color-scheme: dark)" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");var d=document.documentElement;d.classList.remove("light","dark");if(t==="light"||t==="dark"){d.classList.add(t)}else{d.classList.add(window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light")}}catch(e){d.classList.add("light")}})()`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `if("serviceWorker"in navigator){window.addEventListener("load",function(){navigator.serviceWorker.register("/sw.js")})}`,
          }}
        />
      </head>
      <body className={`${poppins.variable} font-sans bg-background text-foreground antialiased`}>
        <ThemeProvider>
          <ChatStateProvider>
            <TooltipProvider>
              <SidebarProvider>
                <div className="flex min-h-screen w-full">
                  <AppSidebar />
                  <main className="flex-1 overflow-hidden relative pb-0">
                    {children}
                  </main>
                </div>
                <MobileBottomNav />
              </SidebarProvider>
            </TooltipProvider>
          </ChatStateProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
