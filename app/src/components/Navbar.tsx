'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV } from '@/components/menu'
import { useEffect, useRef, useState } from 'react'

function cx(...xs: (string | false | undefined)[]) {
  return xs.filter(Boolean).join(' ')
}

export default function Navbar() {
  const [openKey, setOpenKey] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) setOpenKey(null)
    }
    window.addEventListener('click', onClick)
    return () => window.removeEventListener('click', onClick)
  }, [])

  useEffect(() => {
    setOpenKey(null)
    setMobileOpen(false)
  }, [pathname])

  return (
    <div
      ref={ref}
      className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-900/80 dark:supports-[backdrop-filter]:bg-gray-900/60"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex h-14 items-center gap-4">
          <Link href="/" className="font-semibold">AlgoViz</Link>

          {/* Desktop */}
          <nav className="hidden md:flex items-stretch gap-2">
            {NAV.map(cat => (
              <div key={cat.label} className="relative">
                <button
                  className={cx(
                    'h-10 px-3 rounded-md text-sm font-medium',
                    openKey === cat.label
                      ? 'bg-gray-100 dark:bg-gray-800'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  )}
                  aria-haspopup="menu"
                  aria-expanded={openKey === cat.label}
                  onClick={() => setOpenKey(k => (k === cat.label ? null : cat.label))}
                >
                  {cat.label}
                </button>
                <div
                  role="menu"
                  className={cx(
                    'absolute left-0 mt-2 w-64 rounded-xl border bg-white shadow-lg dark:bg-gray-900 dark:border-gray-800',
                    openKey === cat.label ? 'block' : 'hidden'
                  )}
                >
                  <ul className="py-2 text-sm">
                    {cat.items.map(item => {
                      const active = pathname === item.href
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={cx(
                              'block px-3 py-2',
                              active
                                ? 'bg-gray-100 font-medium dark:bg-gray-800'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                            )}
                          >
                            {item.title}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>
            ))}
          </nav>

          {/* Right */}
          <div className="ml-auto flex items-center gap-2">
            <button
              className="md:hidden inline-flex items-center justify-center rounded-lg border px-2 py-1 text-sm"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className={cx('md:hidden fixed inset-0 z-50', mobileOpen ? '' : 'pointer-events-none')}>
        <div
          className={cx('absolute inset-0 bg-black/40 transition-opacity', mobileOpen ? 'opacity-100' : 'opacity-0')}
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={cx(
            'absolute inset-x-0 top-0 rounded-b-2xl border-b bg-white dark:bg-gray-900 shadow-lg p-4 transition-transform',
            mobileOpen ? 'translate-y-0' : '-translate-y-full'
          )}
        >
          <div className="flex items-center h-10">
            <span className="font-semibold">Menu</span>
            <button
              className="ml-auto rounded-md border px-2 py-1 text-sm"
              onClick={() => setMobileOpen(false)}
            >
              Close
            </button>
          </div>
          <div className="mt-3 divide-y divide-gray-200 dark:divide-gray-800">
            {NAV.map(cat => (
              <details key={cat.label} className="py-2 group">
                <summary className="cursor-pointer list-none flex items-center justify-between py-1">
                  <span className="text-sm font-medium">{cat.label}</span>
                  <span className="text-xs text-gray-500 group-open:rotate-180 transition">⌄</span>
                </summary>
                <ul className="mt-1 pl-2 text-sm">
                  {cat.items.map(item => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="block px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
