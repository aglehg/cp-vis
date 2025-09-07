export interface NavItem { title: string; href: string }
export interface NavCategory { label: string; items: NavItem[] }

export const NAV: NavCategory[] = [
  {
    label: 'Tools',
    items: [
      { title: 'Prefix Sum (2D)', href: '/tools/prefix-sum-2d' },
      { title: 'Prefix Sum (1D)', href: '/tools/prefix-sum-1d' },
      { title: 'Count (Fenwick)', href: '/tools/count-fenwick' },
      { title: 'Coordinate Compression', href: '/tools/coord-compression' },
    ],
  },
  {
    label: 'Data Structures',
    items: [
      { title: 'Fenwick Tree', href: '/ds/fenwick' },
      { title: 'Segment Tree', href: '/ds/segment-tree' },
    ],
  },
  /*{
    label: 'Algorithms',
    items: [
      { title: 'BFS', href: '/algos/bfs' },
      { title: 'Dijkstra', href: '/algos/dijkstra' },
    ],
  },*/
  {
    label: 'Leetcode',
    items: [
      { title: '3027', href: '/leetcode/3027' }, 
      { title: '2749', href: '/leetcode/2749' }, 
    ],
  },
]
