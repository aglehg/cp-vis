'use client'

import Link from 'next/link'
import NavLink from './NavLink'

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
return (
<>
{/* Scrim for mobile */}
<div
className={`fixed inset-0 z-30 bg-black/40 md:hidden transition-opacity ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
onClick={onClose}
/>
<aside
className={`fixed z-40 md:static inset-y-0 left-0 w-72 bg-white dark:bg-gray-900 border-r p-4 flex flex-col transition-transform md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
aria-label="Sidebar"
>
<div className="mb-4">
<Link href="/" className="text-lg font-semibold">Menu</Link>
</div>
<nav className="space-y-2 text-sm">
<div>
<div className="px-2 py-1 text-xs uppercase tracking-wider text-gray-500">Tools</div>
<ul className="space-y-1">
<li><NavLink href="/tools/prefix-sum">Prefix Sum</NavLink></li>
<li><NavLink href="/tools/coord-compression">Coordinate Compression</NavLink></li>
</ul>
</div>
<div>
<div className="mt-4 px-2 py-1 text-xs uppercase tracking-wider text-gray-500">Data Structures</div>
<ul className="space-y-1">
<li><NavLink href="/ds/fenwick">Fenwick Tree</NavLink></li>
<li><NavLink href="/ds/segment-tree">Segment Tree</NavLink></li>
</ul>
</div>
<div>
<div className="mt-4 px-2 py-1 text-xs uppercase tracking-wider text-gray-500">Algorithms</div>
<ul className="space-y-1">
<li><NavLink href="/algos/bfs">BFS</NavLink></li>
<li><NavLink href="/algos/dijkstra">Dijkstra</NavLink></li>
</ul>
</div>
</nav>
<div className="mt-auto pt-4 text-xs text-gray-500">
<p>© {new Date().getFullYear()} AlgoViz</p>
</div>
</aside>
</>
)
}