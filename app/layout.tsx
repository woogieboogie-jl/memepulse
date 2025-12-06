import type { Metadata } from 'next'
import { Press_Start_2P, Share_Tech_Mono, Inter_Tight } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { DemoControlPanel } from '@/components/demo-control-panel'
import './globals.css'

const pressStart2P = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-press-start-2p',
  display: 'swap',
})

const shareTechMono = Share_Tech_Mono({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-share-tech-mono',
  display: 'swap',
})

const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-inter-tight',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'MemePulse - Gamified AI Trading',
  description: 'Deploy AI agents, mine $M, and dominate the meme economy.',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

import { Providers } from '@/components/providers'
import { GlobalTicker } from '@/components/global-ticker'
import { Footer } from '@/components/footer'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${interTight.variable} ${pressStart2P.variable} ${shareTechMono.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window !== 'undefined') {
                  window.addEventListener('DOMContentLoaded', function() {
                    var container = document.createElement('div');
                    container.style.cssText = 'position:fixed;top:120px;left:0;right:0;bottom:0;z-index:-10;overflow:hidden;pointer-events:none;background-color:black';
                    
                    var video = document.createElement('video');
                    video.autoplay = true;
                    video.loop = true;
                    video.muted = true;
                    video.playsInline = true;
                    video.style.cssText = 'width:100%;height:100%;object-fit:contain;opacity:1.0';
                    
                    var source = document.createElement('source');
                    source.src = '/background_1.mp4';
                    source.type = 'video/mp4';
                    video.appendChild(source);
                    
                    var overlay = document.createElement('div');
                    overlay.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,0.2)';
                    
                    container.appendChild(video);
                    container.appendChild(overlay);
                    document.body.appendChild(container);
                  });
                }
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            forcedTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            <GlobalTicker />
            <div className="flex flex-col min-h-screen font-mono">
              <div className="flex-1">{children}</div>
              <Footer />
            </div>
            <DemoControlPanel />
          </ThemeProvider>
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
