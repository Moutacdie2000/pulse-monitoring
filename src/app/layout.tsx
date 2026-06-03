import type { Metadata } from 'next'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Pulse · monitoring & pages de statut',
  description: 'Surveillez vos services et publiez de belles pages de statut. Multi-tenant, alertes, incidents.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          rel="icon"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%230e9f6e'/%3E%3Cpath d='M5 17h6l3-8 4 14 3-6h6' fill='none' stroke='white' stroke-width='2.4' stroke-linejoin='round' stroke-linecap='round'/%3E%3C/svg%3E"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
