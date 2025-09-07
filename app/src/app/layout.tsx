import type { Metadata } from 'next'
import './globals.css'
import Shell from '@/components/Shell'

export const metadata: Metadata = {
  title: 'AlgoViz UI',
  description: 'Visualising common competitive programming tools, algorithms and data structures',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
return (
<html lang="en">
  <body>
    <Shell>{children}</Shell>
  </body>
</html>
)
}