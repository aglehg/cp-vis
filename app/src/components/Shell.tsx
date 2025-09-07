'use client'
import Navbar from '@/components/Navbar'

 export default function Shell({ children }: { children: React.ReactNode }) {
   return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      <footer className="border-t text-xs text-gray-500 dark:text-gray-400 p-4 text-center">
        © {new Date().getFullYear()} AlgoViz
        <a href="https://github.com/aglehg/cp-vis" target='_blank' className="ml-2 underline">GitHub Repo</a>
      </footer>
    </div>
   )
 }
