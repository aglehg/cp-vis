'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
const pathname = usePathname()
const active = pathname === href
const base = 'block rounded-md px-2 py-1'
const rest = active
? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
: 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'

return (
    <Link href={href} className={`${base} ${rest}`} aria-current={active ? 'page' : undefined}>
        {children}
    </Link>
)
}