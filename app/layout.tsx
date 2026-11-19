import './globals.css'
export const metadata = { title: 'PrawkoStart – nauka teorii prawa jazdy kat. B' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="pl"><body className="bg-[#f7f6f2] dark:bg-slate-900 text-[#14213d] dark:text-slate-100 antialiased">{children}</body></html>
}
