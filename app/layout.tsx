import './globals.css'
export const metadata = { title: 'PrawkoStart – nauka teorii prawa jazdy kat. B' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="pl"><body className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100">{children}</body></html>
}
