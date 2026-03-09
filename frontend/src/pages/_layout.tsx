import type { ReactNode } from 'react'
import '../globals.css'
import CookieConsent from '../components/CookieConsent'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>conflictradar.live — Real-time Global Event Map</title>
        <meta name="description" content="Real-time global event map. Live tracking of conflicts, protests, disasters, and political developments sourced from hundreds of news outlets worldwide." />
        <link rel="canonical" href="https://conflictradar.live/" />
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="conflictradar.live" />
        <meta property="og:url" content="https://conflictradar.live/" />
        <meta property="og:title" content="conflictradar.live — Real-time Global Event Map" />
        <meta property="og:description" content="Real-time global event map. Live tracking of conflicts, protests, disasters, and political developments sourced from hundreds of news outlets worldwide." />
        {/* Twitter */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="conflictradar.live — Real-time Global Event Map" />
        <meta name="twitter:description" content="Real-time global event map. Live tracking of conflicts, protests, disasters, and political developments sourced from hundreds of news outlets worldwide." />
        {/* Theme */}
        <meta name="theme-color" content="#0f0f13" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        {/* Arabic font — activated by CSS :lang(ar) / [dir="rtl"] rule */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet" />
        {/* Apply lang/dir from cookie before first paint to prevent RTL flicker */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var m=document.cookie.match(/(?:^|;\\s*)lang=([^;]+)/);var l=m&&(m[1]==='ar'||m[1]==='en')?m[1]:null;if(!l){var n=(navigator.language||(navigator.languages&&navigator.languages[0])||'en');l=n.toLowerCase().startsWith('ar')?'ar':'en';}document.documentElement.lang=l;document.documentElement.dir=l==='ar'?'rtl':'ltr';}catch(e){}})();` }} />
      </head>
      <body>
        {children}
        <CookieConsent />
      </body>
    </html>
  )
}

export const getConfig = async () => ({ render: 'static' as const })
