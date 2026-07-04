import './globals.css'
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'
import { Providers } from './providers'
import { Toaster } from 'sonner'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const cravelo = localFont({
  src: './fonts/cravelo-demo.otf',
  variable: '--font-display',
  display: 'swap',
})

export const metadata = {
  title: "Freshers' Quiz Challenge",
  description: 'Live quiz competition for the freshers orientation event',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${cravelo.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{__html:'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}} />
      </head>
      <body className="bg-background text-foreground antialiased font-sans">
        <Providers>{children}</Providers>
        <Toaster position="top-right" theme="dark" closeButton />
      </body>
    </html>
  )
}
